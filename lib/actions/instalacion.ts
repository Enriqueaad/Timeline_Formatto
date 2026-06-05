"use server";

import { revalidatePath } from "next/cache";
import type { EtapaInstalacion } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const FLUJO_PRINCIPAL: EtapaInstalacion[] = [
  "PEDIDO",
  "FABRICACION",
  "DESPACHO",
  "INSTALACION",
  "ENTREGA_CONFORME",
];

function esRetroceso(actual: EtapaInstalacion, siguiente: EtapaInstalacion) {
  const actualIndex = FLUJO_PRINCIPAL.indexOf(actual);
  const siguienteIndex = FLUJO_PRINCIPAL.indexOf(siguiente);
  return actualIndex >= 0 && siguienteIndex >= 0 && siguienteIndex < actualIndex;
}

export async function avanzarEtapa(
  itemId: string,
  etapa: EtapaInstalacion,
  usuario: string,
  nota?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const item = await prisma.itemInstalacion.findUnique({
      where: { id: itemId },
      include: { unidad: { select: { id: true, proyectoId: true } } },
    });

    if (!item) return { ok: false, error: "Item no encontrado." };
    if (esRetroceso(item.etapa, etapa)) {
      return { ok: false, error: "No se puede retroceder una etapa del flujo principal." };
    }

    await prisma.$transaction([
      prisma.itemInstalacion.update({
        where: { id: itemId },
        data: { etapa },
      }),
      prisma.historialEtapa.create({
        data: {
          itemId,
          etapa,
          usuario,
          nota: nota?.trim() || null,
        },
      }),
    ]);

    revalidatePath(`/proyectos/${item.unidad.proyectoId}/unidades/${item.unidad.id}`);
    revalidatePath(`/proyectos/${item.unidad.proyectoId}/unidades`);
    revalidatePath("/unidades");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No fue posible avanzar la etapa.",
    };
  }
}

export async function agregarObservacion(
  itemId: string,
  nota: string,
  usuario: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const item = await prisma.itemInstalacion.findUnique({
      where: { id: itemId },
      include: { unidad: { select: { id: true, proyectoId: true } } },
    });

    if (!item) return { ok: false, error: "Item no encontrado." };
    if (!nota.trim()) return { ok: false, error: "La observacion no puede estar vacia." };

    await prisma.historialEtapa.create({
      data: {
        itemId,
        etapa: item.etapa,
        usuario,
        nota: nota.trim(),
      },
    });

    revalidatePath(`/proyectos/${item.unidad.proyectoId}/unidades/${item.unidad.id}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No fue posible agregar la observacion.",
    };
  }
}
