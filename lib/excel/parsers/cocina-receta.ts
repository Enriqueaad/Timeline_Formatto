import * as XLSX from "xlsx";
import { toNumberOrNull, toText, type RecetaParseada } from "../types";

// Índices de columna en la hoja RECETA (headers en fila 1, índice base 0).
// La relación con NV_RTA es por SKU = columna índice 3.
const COL = {
  SKU: 3,
  SKU_MATERIAL: 5,
  MATERIAL_PIEZA: 6,
  COLOR_PIEZA: 7,
  CATEGORIA: 8,
  ESPESOR: 9,
  SKU_TAPACANTO: 10,
  DESC_TAPACANTO: 12,
  LARGO: 14,
  ANCHO: 15,
  RECUENTO: 16,
  VETA: 19,
  DESCRIPCION: 20,
  COD_PROGRAMA: 21,
} as const;

/**
 * Lee la hoja RECETA del workbook de cocina y devuelve un mapa SKU → piezas de receta.
 * Un SKU sin receta simplemente no aparece en el mapa (el consumidor usa array vacío).
 */
export function parseCocinaReceta(workbook: XLSX.WorkBook): Map<string, RecetaParseada[]> {
  const mapa = new Map<string, RecetaParseada[]>();
  const sheet = workbook.Sheets.RECETA;
  if (!sheet) return mapa;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false });

  // Fila 0 = headers; datos desde fila 1.
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const sku = toText(row[COL.SKU]);
    if (!sku) continue;

    const pieza: RecetaParseada = {
      codMaterial:     toText(row[COL.SKU_MATERIAL]) ?? "",
      descripMaterial: toText(row[COL.MATERIAL_PIEZA]),
      material:        toText(row[COL.CATEGORIA]),
      colorMaterial:   toText(row[COL.COLOR_PIEZA]),
      espesor:         toText(row[COL.ESPESOR]),
      codTapacanto:    toText(row[COL.SKU_TAPACANTO]),
      descTapacanto:   toText(row[COL.DESC_TAPACANTO]),
      largo:           toNumberOrNull(row[COL.LARGO]),
      ancho:           toNumberOrNull(row[COL.ANCHO]),
      cantUni:         toNumberOrNull(row[COL.RECUENTO]),
      veta:            toText(row[COL.VETA]),
      piezaInsumo:     toText(row[COL.DESCRIPCION]),
      codPrograma:     toText(row[COL.COD_PROGRAMA]),
    };

    const lista = mapa.get(sku) ?? [];
    lista.push(pieza);
    mapa.set(sku, lista);
  }

  return mapa;
}
