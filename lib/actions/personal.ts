"use server";

import { revalidatePath } from "next/cache";
import type { EstadoPersonal, TipoContrato, TipoPersonal } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function splitNombreCompleto(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    nombre: parts[0] ?? "Sin",
    paterno: parts.slice(1).join(" ") || "Apellido",
  };
}

function cleanRut(value?: string | null) {
  const rut = value?.trim();
  return rut && rut.length > 0 ? rut : `SIN-RUT-${Date.now()}`;
}

export async function crearPersonal(data: {
  nombre: string;
  rut?: string;
  cargo?: string;
  tipoContrato: TipoContrato;
  tipo?: TipoPersonal;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const nombreCompleto = splitNombreCompleto(data.nombre);
    const personal = await prisma.personal.create({
      data: {
        rut: cleanRut(data.rut),
        nombre: nombreCompleto.nombre,
        paterno: nombreCompleto.paterno,
        materno: null,
        cargo: data.cargo?.trim() || "Instalador",
        tipoContrato: data.tipoContrato,
        tipo: data.tipo ?? "FORMATTO",
        estado: "ACTIVO",
      },
    });

    revalidatePath("/dotacion");
    return { ok: true, id: personal.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible crear personal." };
  }
}

export async function editarPersonal(
  id: string,
  data: Partial<{
    nombre: string;
    rut: string;
    cargo: string;
    tipoContrato: TipoContrato;
    tipo: TipoPersonal;
    estado: EstadoPersonal;
  }>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const nombreCompleto = data.nombre ? splitNombreCompleto(data.nombre) : null;
    await prisma.personal.update({
      where: { id },
      data: {
        ...(nombreCompleto ? { nombre: nombreCompleto.nombre, paterno: nombreCompleto.paterno } : {}),
        ...(data.rut !== undefined ? { rut: cleanRut(data.rut) } : {}),
        ...(data.cargo !== undefined ? { cargo: data.cargo?.trim() || "Instalador" } : {}),
        ...(data.tipoContrato ? { tipoContrato: data.tipoContrato } : {}),
        ...(data.tipo ? { tipo: data.tipo } : {}),
        ...(data.estado ? { estado: data.estado } : {}),
      },
    });

    revalidatePath("/dotacion");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible editar personal." };
  }
}

export async function desvincularPersonal(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$transaction([
      prisma.asignacionPersonal.updateMany({
        where: { personalId: id, fechaFin: null },
        data: { fechaFin: new Date(), desvincular: true },
      }),
      prisma.personal.update({
        where: { id },
        data: { estado: "DESVINCULADO" },
      }),
    ]);

    revalidatePath("/dotacion");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible desvincular personal." };
  }
}
