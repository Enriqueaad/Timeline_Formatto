import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Creación mínima (etapa 1): identidad. El resto se completa en etapas posteriores.
const ProyectoSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido"),
  constructora: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const payload = ProyectoSchema.parse(await request.json());
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre: payload.nombre.trim(),
        constructora: payload.constructora?.trim() || null,
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
