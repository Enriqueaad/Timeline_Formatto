"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function registrarAvance(data: {
  proyectoId: string;
  fecha: string;
  porcentaje: number;
  unidadesCompletadas?: number;
  unidadesTotales?: number;
  observacion?: string;
  registradoPor?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (data.porcentaje < 0 || data.porcentaje > 100) {
      return { ok: false, error: "El porcentaje debe estar entre 0 y 100." };
    }
    const fecha = new Date(data.fecha);
    await prisma.avanceObra.create({
      data: {
        proyectoId: data.proyectoId,
        fecha: Number.isNaN(fecha.getTime()) ? new Date() : fecha,
        porcentaje: data.porcentaje,
        unidadesCompletadas: Math.round(data.unidadesCompletadas ?? 0),
        unidadesTotales: Math.round(data.unidadesTotales ?? 0),
        registradoPor: data.registradoPor || "sistema",
        observacion: data.observacion?.trim() || null,
      },
    });

    revalidatePath(`/dotacion/${data.proyectoId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible registrar avance." };
  }
}
