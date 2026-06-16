import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseWorkbookFromBuffer } from "@/lib/excel/detector";
import { persistirCargaExcel } from "@/lib/excel/persistir";
import type { TipoExcel } from "@/lib/excel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ModoCarga = "reemplazar" | "agregar";

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadOriginalFile(proyectoId: string, file: File, buffer: Buffer) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const path = `${proyectoId}/${Date.now()}_${safeFilename(file.name)}`;
  const { error } = await supabase.storage.from("excel-uploads").upload(path, buffer, {
    contentType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: true,
  });

  if (error) return null;
  return path;
}

function tipoArchivo(tipo: TipoExcel) {
  return tipo === "OTRO" ? "OTRO" : tipo;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const proyectoId = String(form.get("proyectoId") ?? "");
    const modo = String(form.get("modo") ?? "agregar") as ModoCarga;
    const cargadoPor = String(form.get("cargadoPor") ?? "sistema");
    // Cuántas torres físicas confirmó el usuario (default 1 → torre = null para todos).
    const torresConfirmadas = Math.max(1, Math.round(Number(form.get("torresConfirmadas") ?? 1)) || 1);

    if (!(file instanceof File)) return NextResponse.json({ error: "Falta archivo Excel." }, { status: 400 });
    if (!proyectoId) return NextResponse.json({ error: "Falta proyectoId." }, { status: 400 });
    if (modo !== "reemplazar" && modo !== "agregar") return NextResponse.json({ error: "Modo invalido." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = parseWorkbookFromBuffer(buffer);
    if (result.error || result.tipo === "OTRO") {
      return NextResponse.json({ error: result.error ?? "Tipo de Excel no soportado." }, { status: 400 });
    }

    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyectoId }, select: { id: true } });
    if (!proyecto) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

    const urlBlob = await uploadOriginalFile(proyectoId, file, buffer);

    const { unidadesNuevas, items, recetas } = await persistirCargaExcel(prisma, {
      proyectoId,
      result,
      modo,
      torresConfirmadas,
    });

    // Registro del archivo cargado (fuera de la transacción de datos).
    await prisma.archivoExcel.create({
      data: {
        proyectoId,
        tipo: tipoArchivo(result.tipo),
        nombreOriginal: file.name,
        urlBlob,
        filasLeidas: result.filasLeidas,
        unidadesDetectadas: result.unidades.length,
        cargadoPor,
      },
    });

    return NextResponse.json({
      ok: true,
      unidades: result.unidades.length,
      unidadesNuevas,
      items,
      recetas,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible cargar el archivo." },
      { status: 400 }
    );
  }
}
