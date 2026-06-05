import * as XLSX from "xlsx";
import { getField, toNumber, toText, type ResultadoParseo, type TipoExcel, type UnidadParseada } from "../types";

export function parseCloset(workbook: XLSX.WorkBook, tipo: TipoExcel): ResultadoParseo {
  const sheet = workbook.Sheets.CUADRO;
  if (!sheet) return { tipo, unidades: [], filasLeidas: 0, error: "No se encontro la hoja CUADRO." };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false, range: 2 });
  const unidades = new Map<string, UnidadParseada>();

  for (const row of rows) {
    const piso = toText(getField(row, ["PISO", "Piso"]));
    if (!piso) continue;
    const dpto = toText(getField(row, ["DPTO", "Dpto", "Departamento"]));
    if (!dpto) continue;

    const torre = toText(getField(row, ["TORRE", "Torre"]));
    const unitKey = `${piso}::${dpto}::${torre ?? ""}`;
    const unidad = unidades.get(unitKey) ?? {
      piso,
      dpto,
      torre,
      tipo: toText(getField(row, ["TIPO", "Tipo"])),
      items: [],
    };

    unidad.items.push({
      sku: toText(getField(row, ["COD", "Codigo", "SKU"])),
      descripcion: toText(getField(row, ["MUEBLE", "Descripcion"])),
      subconjunto: toText(getField(row, ["SUB CONJUNTO", "Sub Conjunto", "Subconjunto"])),
      cantidad: Math.max(1, Math.round(toNumber(getField(row, ["CANTIDAD", "Cantidad"]), 1))),
      costo: toNumber(getField(row, ["COSTO", "Costo"]), 0),
    });

    unidades.set(unitKey, unidad);
  }

  return { tipo, unidades: Array.from(unidades.values()), filasLeidas: rows.length };
}
