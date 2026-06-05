import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseWorkbook, readWorkbook } from "@/lib/excel/detector";
import type { TipoExcel, UnidadParseada } from "@/lib/excel/types";

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

function tiposUnidad(unidades: UnidadParseada[]) {
  return Array.from(new Set(unidades.map((unidad) => unidad.tipo).filter(Boolean))) as string[];
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const proyectoId = String(form.get("proyectoId") ?? "");
    const modo = String(form.get("modo") ?? "agregar") as ModoCarga;
    const cargadoPor = String(form.get("cargadoPor") ?? "sistema");

    if (!(file instanceof File)) return NextResponse.json({ error: "Falta archivo Excel." }, { status: 400 });
    if (!proyectoId) return NextResponse.json({ error: "Falta proyectoId." }, { status: 400 });
    if (modo !== "reemplazar" && modo !== "agregar") return NextResponse.json({ error: "Modo invalido." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = readWorkbook(buffer);
    const result = parseWorkbook(workbook);
    if (result.error || result.tipo === "OTRO") {
      return NextResponse.json({ error: result.error ?? "Tipo de Excel no soportado." }, { status: 400 });
    }

    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyectoId }, select: { id: true } });
    if (!proyecto) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

    const urlBlob = await uploadOriginalFile(proyectoId, file, buffer);
    const unitTipos = tiposUnidad(result.unidades);
    let unidadesCargadas = 0;
    let itemsCargados = 0;

    await prisma.$transaction(async (tx) => {
      if (modo === "reemplazar") {
        const unidadesPrevias = await tx.unidad.findMany({
          where: {
            proyectoId,
            OR: [
              ...(result.tipo === "COCINA" ? [{ tipo: { startsWith: "CO_" } }, { tipo: { in: unitTipos } }] : []),
              ...(result.tipo === "PIERNAS" ? [{ items: { some: { subconjunto: { equals: "PIERNAS" } } } }] : []),
              ...(result.tipo === "CLOSET_INTERIOR" ? [{ items: { some: { NOT: { subconjunto: { equals: "PIERNAS" } } } } }] : []),
            ],
          },
          select: { id: true },
        });
        const unidadIds = unidadesPrevias.map((unidad) => unidad.id);
        if (unidadIds.length > 0) {
          const itemsPrevios = await tx.itemInstalacion.findMany({ where: { unidadId: { in: unidadIds } }, select: { id: true } });
          const itemIds = itemsPrevios.map((item) => item.id);
          if (itemIds.length > 0) await tx.historialEtapa.deleteMany({ where: { itemId: { in: itemIds } } });
          await tx.itemInstalacion.deleteMany({ where: { unidadId: { in: unidadIds } } });
          await tx.unidad.deleteMany({ where: { id: { in: unidadIds } } });
        }
      }

      for (const unidad of result.unidades) {
        const existente = await tx.unidad.findFirst({
          where: {
            proyectoId,
            piso: unidad.piso,
            dpto: unidad.dpto,
            torre: unidad.torre ?? null,
          },
          select: { id: true },
        });

        const savedUnidad = existente
          ? await tx.unidad.update({
              where: { id: existente.id },
              data: { tipo: unidad.tipo ?? null, torre: unidad.torre ?? null },
              select: { id: true },
            })
          : await tx.unidad.create({
              data: {
                proyectoId,
                piso: unidad.piso,
                dpto: unidad.dpto,
                torre: unidad.torre ?? null,
                tipo: unidad.tipo ?? null,
              },
              select: { id: true },
            });

        unidadesCargadas += existente ? 0 : 1;
        if (unidad.items.length > 0) {
          await tx.itemInstalacion.createMany({
            data: unidad.items.map((item) => ({
              unidadId: savedUnidad.id,
              sku: item.sku ?? null,
              descripcion: item.descripcion ?? null,
              subconjunto: item.subconjunto ?? null,
              cantidad: item.cantidad,
              costo: item.costo ?? null,
            })),
          });
          itemsCargados += unidad.items.length;
        }
      }

      await tx.archivoExcel.create({
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
    });

    return NextResponse.json({ ok: true, unidades: result.unidades.length, unidadesNuevas: unidadesCargadas, items: itemsCargados });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible cargar el archivo." },
      { status: 400 }
    );
  }
}

