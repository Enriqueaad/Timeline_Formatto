"use server";

import { revalidatePath } from "next/cache";
import type { DiaSemana } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, toLunes } from "@/lib/rutas/date";

type ParadaInput = {
  proyectoId: string;
  diaVisita: DiaSemana;
  orden: number;
  horaEstimada?: string;
  observacion?: string;
};

async function upsertRuta(supervisorId: string, semana: string, paradas: ParadaInput[]) {
  const semanaDate = new Date(`${toLunes(semana)}T00:00:00`);
  return prisma.$transaction(async (tx) => {
    let ruta = await tx.rutaVisita.findFirst({ where: { supervisorId, semana: semanaDate } });
    if (!ruta) {
      ruta = await tx.rutaVisita.create({ data: { supervisorId, semana: semanaDate } });
    }
    await tx.paradaRuta.deleteMany({ where: { rutaId: ruta.id } });
    if (paradas.length > 0) {
      await tx.paradaRuta.createMany({
        data: paradas.map((parada) => ({
          rutaId: ruta.id,
          proyectoId: parada.proyectoId,
          diaVisita: parada.diaVisita,
          orden: parada.orden,
          horaEstimada: parada.horaEstimada?.trim() || null,
          observacion: parada.observacion?.trim() || null,
        })),
      });
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

      if (parada.ruta.supervisorId === data.targetSupervisorId) {
        // Mismo supervisor — solo cambia el día
        await tx.paradaRuta.update({
          where: { id: data.paradaId },
          data: { diaVisita: data.targetDia },
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
          data: { rutaId: targetRuta.id, diaVisita: data.targetDia },
        });
      }
    });

    revalidatePath("/rutas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible mover la visita." };
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

    await upsertRuta(
      data.supervisorId,
      semanaActual,
      rutaAnterior.paradas.map((parada) => ({
        proyectoId: parada.proyectoId,
        diaVisita: parada.diaVisita,
        orden: parada.orden,
        horaEstimada: parada.horaEstimada ?? undefined,
        observacion: parada.observacion ?? undefined,
      }))
    );

    revalidatePath(`/supervisores/${data.supervisorId}/ruta`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible copiar semana anterior." };
  }
}
