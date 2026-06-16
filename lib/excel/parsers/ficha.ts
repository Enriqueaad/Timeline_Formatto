import * as XLSX from "xlsx";
import { toNumberOrNull, toText, type RecetaParseada } from "../types";

// Datos del mueble en la cabecera de PLANTILLA_FLEXIBLE (fila/col índice base 0).
const HEAD = {
  PRODUCTO: { r: 1, c: 5 },
  COLOR:    { r: 2, c: 5 },
  COD_SAP:  { r: 3, c: 5 },
  LARGO:    { r: 5, c: 6 },
  ANCHO:    { r: 6, c: 6 },
  ALTURA:   { r: 7, c: 6 },
  TIPO:     { r: 10, c: 3 },
  CONJUNTO: { r: 10, c: 6 },
} as const;

// Región de receta: headers en fila 17 (idx 16), datos desde fila 18 (idx 17).
// Columnas índice base 0 (la tabla arranca en la col 70 = BS).
const RECETA_HEADER_ROW = 16;
const RECETA_FIRST_DATA_ROW = 17;
const COL = {
  COD_MATERIAL:  78,
  DESCR_MATERIAL: 79,
  MATERIAL:      80,
  COLOR_MATERIAL: 81,
  ESP_MATERIAL:  82,
  COD_TAPACANTO: 83,
  DES_TAPACANTO: 84,
  LARGO:         87,
  ANCHO:         88,
  CANT_UNI:      89,
  VETA:          90,
  PIEZA_INSUMO:  91,
  COD_PROG:      92,
} as const;

export type MuebleParseado = {
  producto?: string | null;
  color?: string | null;
  codSap?: string | null;
  largo?: number | null;
  ancho?: number | null;
  espesor?: number | null;
  tipoMueble?: string | null;
  conjunto?: string | null;
};

export type FichaParseada = {
  mueble: MuebleParseado;
  receta: RecetaParseada[];
};

// Una pieza es "real" si tiene COD MATERIAL distinto de 0/'-'/vacío.
function esMaterialValido(cod: string | null): boolean {
  if (!cod) return false;
  const c = cod.trim();
  return c !== "" && c !== "0" && c !== "-";
}

export function parseFicha(workbook: XLSX.WorkBook): FichaParseada {
  const sheet = workbook.Sheets.PLANTILLA_FLEXIBLE;
  if (!sheet) return { mueble: {}, receta: [] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false });
  const at = (r: number, c: number) => rows[r]?.[c] ?? null;

  const mueble: MuebleParseado = {
    producto:   toText(at(HEAD.PRODUCTO.r, HEAD.PRODUCTO.c)),
    color:      toText(at(HEAD.COLOR.r, HEAD.COLOR.c)),
    codSap:     toText(at(HEAD.COD_SAP.r, HEAD.COD_SAP.c)),
    largo:      toNumberOrNull(at(HEAD.LARGO.r, HEAD.LARGO.c)),
    ancho:      toNumberOrNull(at(HEAD.ANCHO.r, HEAD.ANCHO.c)),
    espesor:    toNumberOrNull(at(HEAD.ALTURA.r, HEAD.ALTURA.c)),
    tipoMueble: toText(at(HEAD.TIPO.r, HEAD.TIPO.c)),
    conjunto:   toText(at(HEAD.CONJUNTO.r, HEAD.CONJUNTO.c)),
  };

  const receta: RecetaParseada[] = [];
  for (let r = RECETA_FIRST_DATA_ROW; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const codMaterial = toText(row[COL.COD_MATERIAL]);
    if (!esMaterialValido(codMaterial)) continue;

    receta.push({
      codMaterial:     codMaterial as string,
      descripMaterial: toText(row[COL.DESCR_MATERIAL]),
      material:        toText(row[COL.MATERIAL]),
      colorMaterial:   toText(row[COL.COLOR_MATERIAL]),
      espesor:         toText(row[COL.ESP_MATERIAL]),
      codTapacanto:    toText(row[COL.COD_TAPACANTO]),
      descTapacanto:   toText(row[COL.DES_TAPACANTO]),
      largo:           toNumberOrNull(row[COL.LARGO]),
      ancho:           toNumberOrNull(row[COL.ANCHO]),
      cantUni:         toNumberOrNull(row[COL.CANT_UNI]),
      veta:            toText(row[COL.VETA]),
      piezaInsumo:     toText(row[COL.PIEZA_INSUMO]),
      codPrograma:     toText(row[COL.COD_PROG]),
    });
  }

  // Silenciar variable de header no usada: la dejamos documentada por claridad del layout.
  void RECETA_HEADER_ROW;

  return { mueble, receta };
}
