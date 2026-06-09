"use server";

import { revalidatePath } from "next/cache";
import type { DiaSemana } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, toLunes } from "@/lib/rutas/date";

type ParadaInput = {
  id?: string; // id existente para diff; undefined = parada nueva
  proyectoId: string;
  diaVisita: DiaSemana;
  orden: number;
  horaEstimada?: string;
  observacion?: string;
};

// Calcula el diaOriginal: captura el día del plan inicial la primera vez que
// una parada se mueve; lo limpia si vuelve a su día original.
function calcularDiaOriginal(
  diaActualEnBD: DiaSemana,
  diaOriginalEnBD: DiaSemana | null,
  diaNuevo: DiaSemana
): DiaSemana | null {
  if (diaNuevo === diaActualEnBD) return diaOriginalEnBD; // sin cambio de día
  const original = diaOriginalEnBD ?? diaActualEnBD; // primer día planificado
  return original === diaNuevo ? null : original; // si vuelve al original → limpia
}

// Upsert diferencial: preserva cumplimiento (completada/fechaVisita/notaVisita)
// y rastrea diaOriginal en las paradas existentes en vez de borrar y recrear.
async function upsertRuta(supervisorId: string, semana: string, paradas: ParadaInput[]) {
  const semanaDate = new Date(`${toLunes(semana)}T00:00:00`);
  return prisma.$transaction(async (tx) => {
    let ruta = await tx.rutaVisita.findFirst({
      where: { supervisorId, semana: semanaDate },
      include: { paradas: true },
    });
    if (!ruta) {
      const creada = await tx.rutaVisita.create({ data: { supervisorId, semana: semanaDate } });
      ruta = { ...creada, paradas: [] };
    }

    const existentes = ruta.paradas;
    const idsEntrantes = new Set(paradas.filter((p) => p.id).map((p) => p.id as string));

    // 1. Borrar paradas que ya no vienen en el payload
    const aBorrar = existentes.filter((e) => !idsEntrantes.has(e.id));
    if (aBorrar.length > 0) {
      await tx.paradaRuta.deleteMany({ where: { id: { in: aBorrar.map((d) => d.id) } } });
    }

    // 2. Actualizar existentes (preservando cumplimiento) + crear nuevas
    for (const p of paradas) {
      const db = p.id ? existentes.find((e) => e.id === p.id) : undefined;
      if (db) {
        await tx.paradaRuta.update({
          where: { id: db.id },
          data: {
            diaVisita:    p.diaVisita,
            orden:        p.orden,
            horaEstimada: p.horaEstimada?.trim() || null,
            observacion:  p.observacion?.trim() || null,
            diaOriginal:  calcularDiaOriginal(db.diaVisita, db.diaOriginal, p.diaVisita),
            // completada / fechaVisita / notaVisita NO se tocan — se preservan
          },
        });
      } else {
        await tx.paradaRuta.create({
          data: {
            rutaId:       ruta.id,
            proyectoId:   p.proyectoId,
            diaVisita:    p.diaVisita,
            orden:        p.orden,
            horaEstimada: p.horaEstimada?.trim() || null,
            observacion:  p.observacion?.trim() || null,
            // diaOriginal null, completada false (defaults)
          },
        });
      }
    }
    return ruta;
  });
}

export async function guardarRuta(data: {
  supervisorId: string;
  semana: string;
  paradas: ParadaInput[];
}): Promise<{ ok: boolean; rutaId?: string; error?: string }> {
  try {
    const ruta = await upsertRuta(data.supervisorId, data.semana, data.paradas);
    revalidatePath("/rutas");
    revalidatePath("/supervisores");
    revalidatePath(`/supervisores/${data.supervisorId}`);
    revalidatePath(`/supervisores/${data.supervisorId}/ruta`);
    return { ok: true, rutaId: ruta.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible guardar ruta." };
  }
}

export async function moverParada(data: {
  paradaId: string;
  targetSupervisorId: string;
  targetDia: DiaSemana;
  semana: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const parada = await tx.paradaRuta.findUniqueOrThrow({
        where: { id: data.paradaId },
        include: { ruta: true },
      });

      const semanaDate = new Date(`${toLunes(data.semana)}T00:00:00`);
      const diaOriginal = calcularDiaOriginal(parada.diaVisita, parada.diaOriginal, data.targetDia);

      if (parada.ruta.supervisorId === data.targetSupervisorId) {
        // Mismo supervisor — cambia día + rastrea original
        await tx.paradaRuta.update({
          where: { id: data.paradaId },
          data: { diaVisita: data.targetDia, diaOriginal },
        });
      } else {
        // Distinto supervisor — buscar o crear RutaVisita del destino
        let targetRuta = await tx.rutaVisita.findFirst({
          where: { supervisorId: data.targetSupervisorId, semana: semanaDate },
        });
        if (!targetRuta) {
          targetRuta = await tx.rutaVisita.create({
            data: { supervisorId: data.targetSupervisorId, semana: semanaDate },
          });
        }
        await tx.paradaRuta.update({
          where: { id: data.paradaId },
          data: { rutaId: targetRuta.id, diaVisita: data.targetDia, diaOriginal },
        });
      }
    });

    revalidatePath("/rutas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible mover la visita." };
  }
}

export async function marcarCumplimiento(data: {
  paradaId: string;
  completada: boolean;
  notaVisita?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.paradaRuta.update({
      where: { id: data.paradaId },
      data: {
        completada:  data.completada,
        fechaVisita: data.completada ? new Date() : null,
        notaVisita:  data.notaVisita?.trim() || null,
      },
    });
    revalidatePath("/rutas");
    revalidatePath("/supervisores", "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible marcar la visita." };
  }
}

export async function copiarSemanaAnterior(data: {
  supervisorId: string;
  semanaActual: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const semanaActual = toLunes(data.semanaActual);
    const semanaAnterior = addDays(semanaActual, -7);
    const rutaAnterior = await prisma.rutaVisita.findFirst({
      where: { supervisorId: data.supervisorId, semana: new Date(`${semanaAnterior}T00:00:00`) },
      include: { paradas: true },
    });

    if (!rutaAnterior) return { ok: false, error: "No hay ruta en la semana anterior." };

    // Copia como paradas nuevas (sin id) → empiezan limpias (sin cambios ni cumplimiento)
    await upsertRuta(
      data.supervisorId,
      semanaActual,
      rutaAnterior.paradas.map((parada) => ({
        proyectoId:   parada.proyectoId,
        diaVisita:    parada.diaVisita,
        orden:        parada.orden,
        horaEstimada: parada.horaEstimada ?? undefined,
        observacion:  parada.observacion ?? undefined,
      }))
    );

    revalidatePath(`/supervisores/${data.supervisorId}/ruta`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible copiar semana anterior." };
  }
}
