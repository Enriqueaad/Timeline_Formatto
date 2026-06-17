import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LineaSchema = z.object({
  categoria: z.enum(["COCINA", "CLOSET", "ADICIONAL", "INSTALACION", "OTRO"]),
  tipologia: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  cantidad: z.number().int().min(0),
  valorUnitario: z.number().min(0),
  valorUnitarioUF: z.number().min(0).optional().nullable(),
});

const VentaSchema = z.object({
  fecha: z.string().optional().nullable(),
  valorUF: z.number().positive().optional().nullable(),
  clienteContacto: z.string().optional().nullable(),
  clienteCorreo: z.string().optional().nullable(),
  clienteTelefono: z.string().optional().nullable(),
  lineas: z.array(LineaSchema),
});

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadPdf(proyectoId: string, file: File): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `cotizaciones/${proyectoId}/${Date.now()}_${safeFilename(file.name)}`;
  const { error } = await supabase.storage.from("excel-uploads").upload(path, buffer, {
    contentType: file.type || "application/pdf",
    upsert: true,
  });
  return error ? null : path;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: proyectoId } = await context.params;
    const form = await request.formData();
    const raw = String(form.get("data") ?? "");
    const payload = VentaSchema.parse(JSON.parse(raw));

    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyectoId }, select: { id: true } });
    if (!proyecto) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

    // PDF opcional.
    const pdf = form.get("pdf");
    const pdfUrl = pdf instanceof File && pdf.size > 0 ? await uploadPdf(proyectoId, pdf) : null;

    // Totales calculados desde las líneas.
    const lineas = payload.lineas.map((l, i) => {
      const total = l.cantidad * l.valorUnitario;
      const totalUF = l.valorUnitarioUF != null ? l.cantidad * l.valorUnitarioUF : null;
      return { ...l, total, totalUF, orden: i };
    });
    const totalCLP = lineas.reduce((s, l) => s + l.total, 0);
    const totalUF = lineas.reduce((s, l) => s + (l.totalUF ?? 0), 0);

    // Upsert cabecera + reemplazo de líneas (sin transacción interactiva: pooler).
    const existente = await prisma.cotizacion.findUnique({ where: { proyectoId }, select: { id: true } });

    let cotizacionId: string;
    if (existente) {
      cotizacionId = existente.id;
      await prisma.precioVenta.deleteMany({ where: { cotizacionId } });
      await prisma.cotizacion.update({
        where: { id: cotizacionId },
        data: {
          fecha: parseDate(payload.fecha),
          valorUF: payload.valorUF ?? null,
          clienteContacto: payload.clienteContacto?.trim() || null,
          clienteCorreo: payload.clienteCorreo?.trim() || null,
          clienteTelefono: payload.clienteTelefono?.trim() || null,
          totalCLP,
          totalUF,
          ...(pdfUrl ? { pdfUrl } : {}),
        },
      });
    } else {
      const creada = await prisma.cotizacion.create({
        data: {
          proyectoId,
          fecha: parseDate(payload.fecha),
          valorUF: payload.valorUF ?? null,
          clienteContacto: payload.clienteContacto?.trim() || null,
          clienteCorreo: payload.clienteCorreo?.trim() || null,
          clienteTelefono: payload.clienteTelefono?.trim() || null,
          totalCLP,
          totalUF,
          pdfUrl,
        },
        select: { id: true },
      });
      cotizacionId = creada.id;
    }

    if (lineas.length > 0) {
      await prisma.precioVenta.createMany({
        data: lineas.map((l) => ({
          cotizacionId,
          categoria: l.categoria,
          tipologia: l.tipologia?.trim() || null,
          descripcion: l.descripcion?.trim() || null,
          cantidad: l.cantidad,
          valorUnitario: l.valorUnitario,
          valorUnitarioUF: l.valorUnitarioUF ?? null,
          total: l.total,
          totalUF: l.totalUF,
          orden: l.orden,
        })),
      });
    }

    return NextResponse.json({ ok: true, totalCLP, totalUF, lineas: lineas.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible guardar la cotización." },
      { status: 400 }
    );
  }
}
