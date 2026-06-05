"use server";

import { revalidatePath } from "next/cache";
import type { TipoPersonal } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function crearAsignacion(data: {
  personalId: string;
  proyectoId: string;
  fechaInicio: string;
  costoMensual?: number;
  tipoPersonal?: TipoPersonal;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      if (data.tipoPersonal) {
        await tx.personal.update({ where: { id: data.personalId }, data: { tipo: data.tipoPersonal } });
      }
      await tx.asignacionPersonal.create({
        data: {
          personalId: data.personalId,
          proyectoId: data.proyectoId,
          cantidad: 1,
          cantSubcontrato: data.tipoPersonal === "SUBCONTRATO" ? 1 : null,
          costoMensual: Math.round(data.costoMensual ?? 0),
          fechaInicio: parseDate(data.fechaInicio),
          fechaFin: null,
          desvincular: false,
        },
      });
    });

    revalidatePath("/dotacion");
    revalidatePath(`/dotacion/${data.proyectoId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible crear asignacion." };
  }
}

export async function moverPersonal(data: {
  personalId: string;
  proyectoOrigenId: string;
  proyectoDestinoId: string;
  fechaEfectiva: string;
  costoMensual?: number;
  tipoPersonal?: TipoPersonal;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const fecha = parseDate(data.fechaEfectiva);
    await prisma.$transaction(async (tx) => {
      await tx.asignacionPersonal.updateMany({
        where: { personalId: data.personalId, proyectoId: data.proyectoOrigenId, fechaFin: null },
        data: { fechaFin: fecha },
      });
      if (data.tipoPersonal) {
        await tx.personal.update({ where: { id: data.personalId }, data: { tipo: data.tipoPersonal } });
      }
      await tx.asignacionPersonal.create({
        data: {
          personalId: data.personalId,
          proyectoId: data.proyectoDestinoId,
          cantidad: 1,
          cantSubcontrato: data.tipoPersonal === "SUBCONTRATO" ? 1 : null,
          costoMensual: Math.round(data.costoMensual ?? 0),
          fechaInicio: fecha,
          fechaFin: null,
          desvincular: false,
        },
      });
    });

    revalidatePath("/dotacion");
    revalidatePath(`/dotacion/${data.proyectoOrigenId}`);
    revalidatePath(`/dotacion/${data.proyectoDestinoId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible mover personal." };
  }
}
