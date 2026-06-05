import * as XLSX from "xlsx";
import { normalizeHeader, type ResultadoParseo, type TipoExcel } from "./types";
import { parseCocina } from "./parsers/cocina";
import { parseCloset } from "./parsers/closet";

export function detectExcelType(workbook: XLSX.WorkBook): TipoExcel {
  if (workbook.SheetNames.includes("NV_RTA")) return "COCINA";
  if (!workbook.SheetNames.includes("CUADRO")) return "OTRO";

  const sheet = workbook.Sheets.CUADRO;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false, range: 2 });
  const hasPiernas = rows.some((row) =>
    Object.entries(row).some(([key, value]) =>
      normalizeHeader(key) === "SUB CONJUNTO" && normalizeHeader(value) === "PIERNAS"
    )
  );

  return hasPiernas ? "PIERNAS" : "CLOSET_INTERIOR";
}

export function parseWorkbook(workbook: XLSX.WorkBook): ResultadoParseo {
  const tipo = detectExcelType(workbook);
  if (tipo === "COCINA") return parseCocina(workbook, tipo);
  if (tipo === "CLOSET_INTERIOR" || tipo === "PIERNAS") return parseCloset(workbook, tipo);
  return { tipo, unidades: [], filasLeidas: 0, error: "El archivo no contiene hojas NV_RTA ni CUADRO." };
}

export function readWorkbook(buffer: Buffer) {
  return XLSX.read(buffer, { type: "buffer", cellDates: true });
}
