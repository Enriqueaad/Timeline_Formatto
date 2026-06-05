"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function emptyToNull(value?: string | null) {
  const clean = value?.trim();
  return clean ? clean : null;
}

export async function crearSupervisor(data: {
  nombre: string;
  rut?: string;
  email?: string;
  telefono?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    if (data.nombre.trim().length < 3) return { ok: false, error: "Nombre requerido." };
    const supervisor = await prisma.supervisor.create({
      data: {
        nombre: data.nombre.trim(),
        rut: emptyToNull(data.rut),
        email: emptyToNull(data.email),
        telefono: emptyToNull(data.telefono),
        activo: true,
      },
    });
    revalidatePath("/supervisores");
    return { ok: true, id: supervisor.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible crear supervisor." };
  }
}

export async function editarSupervisor(
  id: string,
  data: Partial<{ nombre: string; rut: string; email: string; telefono: string }>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.supervisor.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
        ...(data.rut !== undefined ? { rut: emptyToNull(data.rut) } : {}),
        ...(data.email !== undefined ? { email: emptyToNull(data.email) } : {}),
        ...(data.telefono !== undefined ? { telefono: emptyToNull(data.telefono) } : {}),
      },
    });
    revalidatePath("/supervisores");
    revalidatePath(`/supervisores/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible editar supervisor." };
  }
}

export async function toggleActivo(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supervisor = await prisma.supervisor.findUnique({ where: { id }, select: { activo: true } });
    if (!supervisor) return { ok: false, error: "Supervisor no encontrado." };
    await prisma.supervisor.update({ where: { id }, data: { activo: !supervisor.activo } });
    revalidatePath("/supervisores");
    revalidatePath(`/supervisores/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible cambiar estado." };
  }
}
