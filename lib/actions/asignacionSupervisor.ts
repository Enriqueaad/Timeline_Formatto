"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Asigna un supervisor a un proyecto.
// Cierra la asignación activa anterior (si existe) y crea una nueva.
export async function asignarSupervisor(data: {
  supervisorId: string;
  proyectoId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Cerrar asignación activa anterior para este proyecto
      await tx.asignacionSupervisor.updateMany({
        where: { proyectoId: data.proyectoId, hasta: null },
        data: { hasta: new Date() },
      });

      // Crear nueva asignación activa
      await tx.asignacionSupervisor.create({
        data: {
          supervisorId: data.supervisorId,
          proyectoId:   data.proyectoId,
        },
      });
    });

    revalidatePath("/rutas/asignacion");
    revalidatePath("/proyectos");
    revalidatePath("/supervisores");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible asignar supervisor." };
  }
}

// Desasigna el supervisor activo de un proyecto (deja sin supervisor).
export async function desasignarSupervisor(data: {
  proyectoId: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.asignacionSupervisor.updateMany({
      where: { proyectoId: data.proyectoId, hasta: null },
      data: { hasta: new Date() },
    });

    revalidatePath("/rutas/asignacion");
    revalidatePath("/proyectos");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible desasignar supervisor." };
  }
}
