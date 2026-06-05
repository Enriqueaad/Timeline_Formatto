import * as XLSX from "xlsx";
import { getField, toNumber, toText, type ResultadoParseo, type TipoExcel, type UnidadParseada } from "../types";

export function parseCocina(workbook: XLSX.WorkBook, tipo: TipoExcel = "COCINA"): ResultadoParseo {
  const sheet = workbook.Sheets.NV_RTA;
  if (!sheet) return { tipo, unidades: [], filasLeidas: 0, error: "No se encontro la hoja NV_RTA." };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false });
  const unidades = new Map<string, UnidadParseada>();

  for (const row of rows) {
    const piso = toText(getField(row, ["Piso"]));
    const dpto = toText(getField(row, ["Departamento", "DPTO", "Dpto"]));
    if (!piso || !dpto) continue;

    const unitKey = `${piso}::${dpto}`;
    const unidad = unidades.get(unitKey) ?? {
      piso,
      dpto,
      torre: null,
      tipo: toText(getField(row, ["Tipo Cocina", "Tipo"])),
      items: [],
    };

    const sku = toText(getField(row, ["SKU", "COD", "Codigo"]));
    const descripcion = toText(getField(row, ["Descripcion", "Descripcion Producto", "Mueble"]));
    const subconjunto = toText(getField(row, ["Subconjunto", "Sub conjunto", "SUB CONJUNTO"]));
    const cantidad = Math.max(1, Math.round(toNumber(getField(row, ["Recuento", "Cantidad", "CANTIDAD"]), 1)));
    const itemKey = `${sku ?? ""}::${descripcion ?? ""}::${subconjunto ?? ""}`;
    const current = unidad.items.find((item) => `${item.sku ?? ""}::${item.descripcion ?? ""}::${item.subconjunto ?? ""}` === itemKey);

    if (current) {
      current.cantidad += cantidad;
    } else {
      unidad.items.push({ sku, descripcion, subconjunto, cantidad, costo: null });
    }

    unidades.set(unitKey, unidad);
  }

  return { tipo, unidades: Array.from(unidades.values()), filasLeidas: rows.length };
}
