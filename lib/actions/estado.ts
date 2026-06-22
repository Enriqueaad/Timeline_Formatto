"use server";

import { revalidatePath } from "next/cache";
import type { EstadoAvance, TipoMueble } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { derivarEstadoDepto } from "@/lib/instalacion/estados";

type Resultado = { ok: boolean; estadoDepto?: EstadoAvance; error?: string };

// Recalcula Unidad.estado a partir de los tipos de mueble presentes (items) y sus EstadoMueble.
// Un tipo presente sin fila EstadoMueble cuenta como PENDIENTE.
async function recalcularEstadoDepto(unidadId: string): Promise<EstadoAvance> {
  const unidad = await prisma.unidad.findUnique({
    where: { id: unidadId },
    select: {
      estadoManual: true,
      items: { select: { tipoMueble: true } },
      estadosMueble: { select: { tipoMueble: true, estado: true } },
    },
  });
  if (!unidad) throw new Error("Unidad no encontrada.");

  const estadoPorTipo = new Map(unidad.estadosMueble.map((e) => [e.tipoMueble, e.estado]));
  const tiposPresentes = Array.from(new Set(unidad.items.map((i) => i.tipoMueble)));
  const estados = tiposPresentes.map((t) => estadoPorTipo.get(t) ?? ("PENDIENTE" as EstadoAvance));
  const derivado = derivarEstadoDepto(estados);

  // Si el estado del depto fue forzado a mano, no lo pisamos: devolvemos el derivado solo informativo.
  if (!unidad.estadoManual) {
    await prisma.unidad.update({ where: { id: unidadId }, data: { estado: derivado } });
    return derivado;
  }
  const actual = await prisma.unidad.findUnique({ where: { id: unidadId }, select: { estado: true } });
  return actual?.estado ?? derivado;
}

// Marca el estado de un tipo de mueble dentro de un depto y re-deriva el estado del depto.
export async function marcarEstadoMueble(data: {
  proyectoId: string;
  unidadId: string;
  tipoMueble: TipoMueble;
  estado: EstadoAvance;
}): Promise<Resultado> {
  try {
    await prisma.estadoMueble.upsert({
      where: { unidadId_tipoMueble: { unidadId: data.unidadId, tipoMueble: data.tipoMueble } },
      create: { unidadId: data.unidadId, tipoMueble: data.tipoMueble, estado: data.estado },
      update: { estado: data.estado },
    });
    const estadoDepto = await recalcularEstadoDepto(data.unidadId);
    revalidatePath(`/proyectos/${data.proyectoId}/unidades`);
    revalidatePath(`/proyectos/${data.proyectoId}/unidades/${data.unidadId}`);
    return { ok: true, estadoDepto };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible marcar el estado." };
  }
}

// Fuerza (override manual) el estado del depto, o lo libera (estado = null → vuelve a derivarse).
export async function setEstadoUnidad(data: {
  proyectoId: string;
  unidadId: string;
  estado: EstadoAvance | null;
}): Promise<Resultado> {
  try {
    if (data.estado === null) {
      await prisma.unidad.update({ where: { id: data.unidadId }, data: { estadoManual: false } });
      const estadoDepto = await recalcularEstadoDepto(data.unidadId);
      revalidatePath(`/proyectos/${data.proyectoId}/unidades`);
      return { ok: true, estadoDepto };
    }
    await prisma.unidad.update({
      where: { id: data.unidadId },
      data: { estado: data.estado, estadoManual: true },
    });
    revalidatePath(`/proyectos/${data.proyectoId}/unidades`);
    revalidatePath(`/proyectos/${data.proyectoId}/unidades/${data.unidadId}`);
    return { ok: true, estadoDepto: data.estado };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible fijar el estado." };
  }
}
