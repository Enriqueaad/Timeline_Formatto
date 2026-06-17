import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateProyectoSchema = z.object({
  nombre: z.string().min(3).optional(),
  constructora: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
  estado: z.enum(["ACTIVO", "PAUSADO", "TERMINADO", "CANCELADO"]).optional(),
  // Definiciones operativas (etapa 4)
  fechaInicio: z.string().optional().nullable(),
  finEstimado: z.string().optional().nullable(),
  tasaInstalacion: z.number().positive().optional().nullable(),
  dotacionProyectada: z.number().int().positive().optional().nullable(),
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
        ...(payload.observacion !== undefined ? { observacion: payload.observacion?.trim() || null } : {}),
        ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
        ...(payload.fechaInicio !== undefined ? { fechaInicio: parseDate(payload.fechaInicio) } : {}),
        ...(payload.finEstimado !== undefined ? { finEstimado: parseDate(payload.finEstimado) } : {}),
        ...(payload.tasaInstalacion !== undefined ? { tasaInstalacion: payload.tasaInstalacion } : {}),
        ...(payload.dotacionProyectada !== undefined ? { dotacionProyectada: payload.dotacionProyectada } : {}),
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

    // Borrado secuencial respetando FKs (hijos antes que padres). Sin transacción
    // interactiva: el pooler de Supabase la rechaza (P2028) y un proyecto puede tener
    // decenas de miles de recetas. deleteMany es idempotente, así que es re-ejecutable.
    await prisma.recetaItem.deleteMany({ where: { item: { unidad: { proyectoId: id } } } });
    await prisma.historialEtapa.deleteMany({ where: { item: { unidad: { proyectoId: id } } } });
    await prisma.itemInstalacion.deleteMany({ where: { unidad: { proyectoId: id } } });
    await prisma.unidad.deleteMany({ where: { proyectoId: id } });
    await prisma.archivoExcel.deleteMany({ where: { proyectoId: id } });
    await prisma.paradaRuta.deleteMany({ where: { proyectoId: id } });
    await prisma.asignacionSupervisor.deleteMany({ where: { proyectoId: id } });
    await prisma.evaluacion.deleteMany({ where: { proyectoId: id } });
    await prisma.avanceObra.deleteMany({ where: { proyectoId: id } });
    await prisma.subcontrato.deleteMany({ where: { proyectoId: id } });
    await prisma.asignacionPersonal.deleteMany({ where: { proyectoId: id } });
    await prisma.proyecto.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible eliminar el proyecto." },
      { status: 400 }
    );
  }
}
