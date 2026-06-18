import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFicha } from "@/lib/excel/parsers/ficha";
import { readWorkbook } from "@/lib/excel/detector";
import { codigoDeNombreFicha, normalizarCodigoFicha } from "@/lib/excel/fichas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Carga las fichas (recetas de closet/piernas). Recibe varios .xlsm; por cada uno
// extrae el código (Cxx) del nombre, parsea la receta (PLANTILLA_FLEXIBLE) y la asigna
// a todos los items del proyecto con ese fichaCodigo. Reemplaza recetas previas de esos items.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: proyectoId } = await context.params;
    const form = await request.formData();
    const files = form.getAll("fichas").filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: "No se recibieron fichas." }, { status: 400 });

    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyectoId }, select: { id: true } });
    if (!proyecto) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

    // Items del proyecto agrupados por código de ficha (solo los que tienen fichaCodigo).
    const items = await prisma.itemInstalacion.findMany({
      where: { unidad: { proyectoId }, fichaCodigo: { not: null } },
      select: { id: true, fichaCodigo: true },
    });
    const itemsPorCodigo = new Map<string, string[]>();
    for (const it of items) {
      const code = normalizarCodigoFicha(it.fichaCodigo);
      if (!code) continue;
      const arr = itemsPorCodigo.get(code) ?? [];
      arr.push(it.id);
      itemsPorCodigo.set(code, arr);
    }

    const resumen: { ficha: string; piezas: number; items: number; recetas: number; nota?: string }[] = [];
    let totalRecetas = 0;

    for (const file of files) {
      const code = normalizarCodigoFicha(codigoDeNombreFicha(file.name));
      if (!code) {
        resumen.push({ ficha: file.name, piezas: 0, items: 0, recetas: 0, nota: "No se pudo leer el código (Cxx) del nombre." });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { receta } = parseFicha(readWorkbook(buffer, ["PLANTILLA_FLEXIBLE"]));
      const itemIds = itemsPorCodigo.get(code) ?? [];

      if (receta.length === 0) {
        resumen.push({ ficha: code, piezas: 0, items: itemIds.length, recetas: 0, nota: "Ficha sin piezas válidas." });
        continue;
      }
      if (itemIds.length === 0) {
        resumen.push({ ficha: code, piezas: receta.length, items: 0, recetas: 0, nota: "Ningún item del proyecto usa esta ficha." });
        continue;
      }

      // Reemplazar recetas previas de estos items (idempotente al recargar fichas).
      await prisma.recetaItem.deleteMany({ where: { itemId: { in: itemIds } } });

      const rows = itemIds.flatMap((itemId) =>
        receta.map((p) => ({
          itemId,
          codMaterial: p.codMaterial,
          descripMaterial: p.descripMaterial ?? null,
          material: p.material ?? null,
          colorMaterial: p.colorMaterial ?? null,
          espesor: p.espesor ?? null,
          codTapacanto: p.codTapacanto ?? null,
          descTapacanto: p.descTapacanto ?? null,
          largo: p.largo ?? null,
          ancho: p.ancho ?? null,
          cantUni: p.cantUni ?? null,
          veta: p.veta ?? null,
          piezaInsumo: p.piezaInsumo ?? null,
          codPrograma: p.codPrograma ?? null,
        }))
      );

      // createMany en lotes para no exceder límites.
      const BATCH = 5000;
      for (let i = 0; i < rows.length; i += BATCH) {
        await prisma.recetaItem.createMany({ data: rows.slice(i, i + BATCH) });
      }
      totalRecetas += rows.length;
      resumen.push({ ficha: code, piezas: receta.length, items: itemIds.length, recetas: rows.length });
    }

    return NextResponse.json({ ok: true, totalRecetas, fichas: resumen });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible cargar las fichas." },
      { status: 400 }
    );
  }
}
