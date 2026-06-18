import type { PrismaClient } from "@prisma/client";
import { normalizarTorre } from "./normalizador-torre";
import type { ResultadoParseo, TipoExcel, UnidadParseada } from "./types";

type ModoCarga = "reemplazar" | "agregar";

export type PersistirParams = {
  proyectoId: string;
  result: ResultadoParseo;
  modo: ModoCarga;
  torresConfirmadas: number;
};

export type PersistirResultado = {
  unidadesNuevas: number;
  items: number;
  recetas: number;
};

function tiposUnidad(unidades: UnidadParseada[]) {
  return Array.from(new Set(unidades.map((u) => u.tipo).filter(Boolean))) as string[];
}

function itemKey(sku: string | null, descripcion: string | null, subconjunto: string | null) {
  return `${sku ?? ""}::${descripcion ?? ""}::${subconjunto ?? ""}`;
}

function condicionReemplazo(tipo: TipoExcel, unitTipos: string[]) {
  if (tipo === "COCINA") return [{ tipo: { startsWith: "CO_" } }, { tipo: { in: unitTipos } }];
  if (tipo === "PIERNAS") return [{ items: { some: { subconjunto: { equals: "PIERNAS" } } } }];
  if (tipo === "CLOSET_INTERIOR") return [{ items: { some: { NOT: { subconjunto: { equals: "PIERNAS" } } } } }];
  return [];
}

/**
 * Persiste el resultado de un parseo de Excel (unidades + items + recetas) dentro de una
 * transacción. Normaliza torres según `torresConfirmadas`. Reutilizable desde la API y
 * desde scripts de prueba.
 */
export async function persistirCargaExcel(
  prisma: PrismaClient,
  { proyectoId, result, modo, torresConfirmadas }: PersistirParams
): Promise<PersistirResultado> {
  const { resolver: resolverTorre } = normalizarTorre(result.torresDetectadas ?? [], torresConfirmadas);
  const unitTipos = tiposUnidad(result.unidades);
  let unidadesNuevas = 0;
  let items = 0;
  let recetas = 0;

  await prisma.$transaction(
    async (tx) => {
      if (modo === "reemplazar") {
        const previas = await tx.unidad.findMany({
          where: { proyectoId, OR: condicionReemplazo(result.tipo, unitTipos) },
          select: { id: true },
        });
        const unidadIds = previas.map((u) => u.id);
        if (unidadIds.length > 0) {
          const itemsPrevios = await tx.itemInstalacion.findMany({ where: { unidadId: { in: unidadIds } }, select: { id: true } });
          const itemIds = itemsPrevios.map((i) => i.id);
          if (itemIds.length > 0) {
            await tx.recetaItem.deleteMany({ where: { itemId: { in: itemIds } } });
            await tx.historialEtapa.deleteMany({ where: { itemId: { in: itemIds } } });
          }
          await tx.itemInstalacion.deleteMany({ where: { unidadId: { in: unidadIds } } });
          await tx.unidad.deleteMany({ where: { id: { in: unidadIds } } });
        }
      }

      for (const unidad of result.unidades) {
        const torre = resolverTorre(unidad.torre);
        const existente = await tx.unidad.findFirst({
          where: { proyectoId, piso: unidad.piso, dpto: unidad.dpto, torre },
          select: { id: true, tipo: true },
        });

        const savedUnidad = existente
          ? await tx.unidad.update({
              where: { id: existente.id },
              // Preservar el tipo original (p.ej. la tipología de cocina CO_x); no pisarlo
              // con el tipo del archivo que enriquece (closet/piernas).
              data: { tipo: existente.tipo ?? unidad.tipo ?? null, torre },
              select: { id: true },
            })
          : await tx.unidad.create({ data: { proyectoId, piso: unidad.piso, dpto: unidad.dpto, torre, tipo: unidad.tipo ?? null }, select: { id: true } });

        unidadesNuevas += existente ? 0 : 1;
        if (unidad.items.length === 0) continue;

        await tx.itemInstalacion.createMany({
          data: unidad.items.map((item) => ({
            unidadId: savedUnidad.id,
            sku: item.sku ?? null,
            descripcion: item.descripcion ?? null,
            subconjunto: item.subconjunto ?? null,
            tipoMueble: item.tipoMueble ?? "OTRO",
            fichaCodigo: item.fichaCodigo ?? null,
            cantidad: item.cantidad,
            costo: item.costo ?? null,
          })),
        });
        items += unidad.items.length;

        const tieneRecetas = unidad.items.some((item) => (item.receta?.length ?? 0) > 0);
        if (!tieneRecetas) continue;

        const creados = await tx.itemInstalacion.findMany({
          where: { unidadId: savedUnidad.id },
          select: { id: true, sku: true, descripcion: true, subconjunto: true },
        });
        const idPorClave = new Map(creados.map((i) => [itemKey(i.sku, i.descripcion, i.subconjunto), i.id]));

        const recetaRows = unidad.items.flatMap((item) => {
          const piezas = item.receta ?? [];
          if (piezas.length === 0) return [];
          const itemId = idPorClave.get(itemKey(item.sku ?? null, item.descripcion ?? null, item.subconjunto ?? null));
          if (!itemId) return [];
          return piezas.map((p) => ({
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
          }));
        });

        if (recetaRows.length > 0) {
          await tx.recetaItem.createMany({ data: recetaRows });
          recetas += recetaRows.length;
        }
      }
    },
    { maxWait: 30000, timeout: 300000 }
  );

  return { unidadesNuevas, items, recetas };
}
