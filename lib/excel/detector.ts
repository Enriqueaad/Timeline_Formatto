import * as XLSX from "xlsx";
import { normalizeHeader, type ResultadoParseo, type TipoExcel } from "./types";
import { parseCocina } from "./parsers/cocina";
import { parseCloset } from "./parsers/closet";

export function detectExcelType(workbook: XLSX.WorkBook): TipoExcel {
  if (workbook.SheetNames.includes("NV_RTA")) return "COCINA";
  if (!workbook.SheetNames.includes("CUADRO")) return "OTRO";

  // Closet y Piernas comparten la hoja CUADRO. Se distinguen porque Piernas tiene
  // valores "PIERNAS" en la columna SUB CONJUNTO. Escaneamos las celdas como arrays
  // (la fila de headers no es fija) buscando el token PIERNAS.
  const sheet = workbook.Sheets.CUADRO;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false });
  const hasPiernas = rows.some((row) =>
    Array.isArray(row) && row.some((value) => normalizeHeader(value) === "PIERNAS")
  );

  return hasPiernas ? "PIERNAS" : "CLOSET_INTERIOR";
}

export function parseWorkbook(workbook: XLSX.WorkBook): ResultadoParseo {
  const tipo = detectExcelType(workbook);
  if (tipo === "COCINA") return parseCocina(workbook, tipo);
  if (tipo === "CLOSET_INTERIOR" || tipo === "PIERNAS") return parseCloset(workbook, tipo);
  return { tipo, unidades: [], filasLeidas: 0, error: "El archivo no contiene hojas NV_RTA ni CUADRO." };
}

export function readWorkbook(buffer: Buffer, sheets?: string[]) {
  return XLSX.read(buffer, { type: "buffer", cellDates: true, ...(sheets ? { sheets } : {}) });
}

/**
 * Lee y parsea un Excel leyendo SOLO las hojas necesarias.
 *
 * El workbook de cocina trae ~20 hojas y leerlas todas consume varios GB y es lento.
 * Por eso primero se leen únicamente los nombres de hoja (bookSheets) para detectar el
 * tipo, y luego se lee el subconjunto de hojas que el parser realmente necesita.
 */
export function parseWorkbookFromBuffer(buffer: Buffer): ResultadoParseo {
  const probe = XLSX.read(buffer, { type: "buffer", bookSheets: true });
  const names = probe.SheetNames;

  if (names.includes("NV_RTA")) {
    const wb = readWorkbook(buffer, ["NV_RTA", "RECETA"]);
    return parseCocina(wb, "COCINA");
  }

  if (names.includes("CUADRO")) {
    const wb = readWorkbook(buffer, ["CUADRO"]);
    const tipo = detectExcelType(wb); // CLOSET_INTERIOR vs PIERNAS según contenido de CUADRO
    return parseCloset(wb, tipo === "PIERNAS" ? "PIERNAS" : "CLOSET_INTERIOR");
  }

  return { tipo: "OTRO", unidades: [], filasLeidas: 0, error: "El archivo no contiene hojas NV_RTA ni CUADRO." };
}
