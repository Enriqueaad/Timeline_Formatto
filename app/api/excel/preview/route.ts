import { NextResponse } from "next/server";
import { parseWorkbook, readWorkbook } from "@/lib/excel/detector";
import type { PreviewResponse, PreviewRow } from "@/lib/excel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPreview(result: ReturnType<typeof parseWorkbook>): PreviewResponse {
  const preview: PreviewRow[] = result.unidades.flatMap((unidad) =>
    unidad.items.map((item) => ({
      piso: unidad.piso,
      dpto: unidad.dpto,
      torre: unidad.torre ?? null,
      tipo: unidad.tipo ?? null,
      sku: item.sku ?? null,
      descripcion: item.descripcion ?? null,
      subconjunto: item.subconjunto ?? null,
      cantidad: item.cantidad,
      costo: item.costo ?? null,
    }))
  ).slice(0, 20);

  const tipos = Array.from(new Set(result.unidades.map((unidad) => unidad.tipo).filter(Boolean))) as string[];
  const totalItems = result.unidades.reduce((sum, unidad) => sum + unidad.items.length, 0);

  return {
    tipo: result.tipo,
    filasLeidas: result.filasLeidas,
    unidades: result.unidades.length,
    preview,
    resumen: { totalItems, tipos },
    error: result.error,
  };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta archivo Excel." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = readWorkbook(buffer);
    const result = parseWorkbook(workbook);
    if (result.error && result.tipo === "OTRO") {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(buildPreview(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible procesar el archivo." },
      { status: 400 }
    );
  }
}
