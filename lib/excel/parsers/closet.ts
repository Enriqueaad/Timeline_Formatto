import * as XLSX from "xlsx";
import {
  normalizeHeader,
  toNumber,
  toText,
  type ItemParseado,
  type ResultadoParseo,
  type TipoExcel,
  type TipoMuebleParsed,
  type UnidadParseada,
} from "../types";

// Headers esperados en CUADRO. La fila de headers NO es fija: algunos archivos la
// traen en fila 1 y otros en fila 3. Por eso la auto-detectamos buscando PISO + DPTO.
const HEADER_ALIASES: Record<string, string[]> = {
  piso: ["PISO"],
  dpto: ["DPTO", "DEPARTAMENTO"],
  tipo: ["TIPO"],
  ficha: ["FICHA"],
  cod: ["COD", "CODIGO", "SKU"],
  mueble: ["MUEBLE", "DESCRIPCION"],
  cantidad: ["CANTIDAD"],
  subconjunto: ["SUB CONJUNTO", "SUBCONJUNTO"],
  costo: ["COSTO"],
  torre: ["TORRE"],
};

// Mapea el valor de SUB CONJUNTO al TipoMueble de Prisma.
function tipoMuebleDeSubconjunto(subconjunto: string | null): TipoMuebleParsed {
  const s = normalizeHeader(subconjunto);
  if (s.includes("PIERNA")) return "PIERNAS";
  if (s.startsWith("QUINC")) return "QUINCALLERIA";
  if (s.includes("INTERIOR")) return "CLOSET_INTERIOR";
  return "OTRO";
}

// Busca la fila de headers (primera fila que contiene PISO y DPTO) y devuelve un
// índice de columna por campo lógico.
function detectarHeaders(rows: unknown[][]) {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] ?? [];
    const norm = row.map((c) => normalizeHeader(c));
    const tienePiso = norm.some((c) => HEADER_ALIASES.piso.includes(c));
    const tieneDpto = norm.some((c) => HEADER_ALIASES.dpto.includes(c));
    if (tienePiso && tieneDpto) {
      const colDe = (campo: keyof typeof HEADER_ALIASES) =>
        norm.findIndex((c) => HEADER_ALIASES[campo].includes(c));
      return {
        headerRow: r,
        cols: {
          piso: colDe("piso"),
          dpto: colDe("dpto"),
          tipo: colDe("tipo"),
          ficha: colDe("ficha"),
          cod: colDe("cod"),
          mueble: colDe("mueble"),
          cantidad: colDe("cantidad"),
          subconjunto: colDe("subconjunto"),
          costo: colDe("costo"),
          torre: colDe("torre"),
        },
      };
    }
  }
  return null;
}

export function parseCloset(workbook: XLSX.WorkBook, tipo: TipoExcel): ResultadoParseo {
  const sheet = workbook.Sheets.CUADRO;
  if (!sheet) return { tipo, unidades: [], filasLeidas: 0, error: "No se encontro la hoja CUADRO." };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false });
  const detect = detectarHeaders(rows);
  if (!detect) {
    return { tipo, unidades: [], filasLeidas: 0, error: "No se encontraron columnas PISO/DPTO en la hoja CUADRO." };
  }

  const { headerRow, cols } = detect;
  const unidades = new Map<string, UnidadParseada>();
  const torres = new Set<string>();
  let filasDatos = 0;

  const cell = (row: unknown[], idx: number) => (idx >= 0 ? row[idx] : null);

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const piso = toText(cell(row, cols.piso));
    const dpto = toText(cell(row, cols.dpto));
    if (!piso || !dpto) continue;
    filasDatos++;

    const torre = toText(cell(row, cols.torre));
    if (torre) torres.add(torre);

    const unitKey = `${piso}::${dpto}::${torre ?? ""}`;
    const unidad = unidades.get(unitKey) ?? {
      piso,
      dpto,
      torre,
      tipo: toText(cell(row, cols.tipo)),
      items: [],
    };

    const subconjunto = toText(cell(row, cols.subconjunto));
    const item: ItemParseado = {
      sku: toText(cell(row, cols.cod)),
      descripcion: toText(cell(row, cols.mueble)),
      subconjunto,
      tipoMueble: tipoMuebleDeSubconjunto(subconjunto),
      cantidad: Math.max(1, Math.round(toNumber(cell(row, cols.cantidad), 1))),
      costo: toNumber(cell(row, cols.costo), 0),
      fichaCodigo: toText(cell(row, cols.ficha)),
      receta: [], // closet: la receta vive en archivos de ficha (C01-C28), no en este archivo
    };
    unidad.items.push(item);

    unidades.set(unitKey, unidad);
  }

  return {
    tipo,
    unidades: Array.from(unidades.values()),
    filasLeidas: filasDatos,
    torresDetectadas: Array.from(torres),
  };
}
