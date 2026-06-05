import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ProyectoSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido"),
  constructora: z.string().optional().nullable(),
  torre: z.string().optional().nullable(),
  finEstimado: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
});

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  try {
    const payload = ProyectoSchema.parse(await request.json());
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre: payload.nombre.trim(),
        constructora: payload.constructora?.trim() || null,
        torre: payload.torre?.trim() || null,
        finEstimado: parseDate(payload.finEstimado),
        observacion: payload.observacion?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, proyecto });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible crear el proyecto." },
      { status: 400 }
    );
  }
}
