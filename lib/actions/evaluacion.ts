"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function crearEvaluacion(data: {
  personalId: string;
  proyectoId: string;
  nota: number;
  periodo: string;
  observacion?: string;
  evaluadoPor?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (data.nota < 1 || data.nota > 5) return { ok: false, error: "La nota debe estar entre 1 y 5." };
    const periodo = new Date(`${data.periodo}-01`);
    await prisma.evaluacion.create({
      data: {
        personalId: data.personalId,
        proyectoId: data.proyectoId,
        nota: data.nota,
        periodo: Number.isNaN(periodo.getTime()) ? new Date() : periodo,
        observacion: data.observacion?.trim() || null,
        evaluadoPor: data.evaluadoPor || "sistema",
      },
    });

    revalidatePath("/dotacion");
    revalidatePath(`/dotacion/${data.proyectoId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible crear evaluacion." };
  }
}
