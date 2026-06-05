import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateProyectoSchema = z.object({
  nombre: z.string().min(3).optional(),
  constructora: z.string().optional().nullable(),
  torre: z.string().optional().nullable(),
  finEstimado: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
  estado: z.enum(["ACTIVO", "PAUSADO", "TERMINADO"]).optional(),
});

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = UpdateProyectoSchema.parse(await request.json());
    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: {
        ...(payload.nombre !== undefined ? { nombre: payload.nombre.trim() } : {}),
        ...(payload.constructora !== undefined ? { constructora: payload.constructora?.trim() || null } : {}),
        ...(payload.torre !== undefined ? { torre: payload.torre?.trim() || null } : {}),
        ...(payload.finEstimado !== undefined ? { finEstimado: parseDate(payload.finEstimado) } : {}),
        ...(payload.observacion !== undefined ? { observacion: payload.observacion?.trim() || null } : {}),
        ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
      },
    });

    return NextResponse.json({ ok: true, proyecto });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible actualizar el proyecto." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const unidades = await prisma.unidad.findMany({ where: { proyectoId: id }, select: { id: true } });
    const unidadIds = unidades.map((unidad) => unidad.id);

    await prisma.$transaction(async (tx) => {
      if (unidadIds.length > 0) {
        await tx.historialEtapa.deleteMany({ where: { item: { unidadId: { in: unidadIds } } } });
        await tx.itemInstalacion.deleteMany({ where: { unidadId: { in: unidadIds } } });
        await tx.unidad.deleteMany({ where: { id: { in: unidadIds } } });
      }
      await tx.archivoExcel.deleteMany({ where: { proyectoId: id } });
      await tx.proyecto.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible eliminar el proyecto." },
      { status: 400 }
    );
  }
}
