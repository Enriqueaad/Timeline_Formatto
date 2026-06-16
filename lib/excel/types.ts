import type { WorkBook } from "xlsx";

export type TipoExcel = "COCINA" | "CLOSET_INTERIOR" | "PIERNAS" | "OTRO";

// Coincide con el enum TipoMueble de Prisma.
export type TipoMuebleParsed =
  | "COCINA"
  | "CLOSET_INTERIOR"
  | "PIERNAS"
  | "QUINCALLERIA"
  | "OTRO";

export type RecetaParseada = {
  codMaterial: string;
  descripMaterial?: string | null;
  material?: string | null;
  colorMaterial?: string | null;
  espesor?: string | null;
  codTapacanto?: string | null;
  descTapacanto?: string | null;
  largo?: number | null;
  ancho?: number | null;
  cantUni?: number | null;
  veta?: string | null;
  piezaInsumo?: string | null;
  codPrograma?: string | null;
};

export type UnidadParseada = {
  piso: string;
  dpto: string;
  torre?: string | null;
  tipo?: string | null;
  items: ItemParseado[];
};

export type ItemParseado = {
  sku?: string | null;
  descripcion?: string | null;
  subconjunto?: string | null;
  tipoMueble?: TipoMuebleParsed;
  cantidad: number;
  costo?: number | null;
  fichaCodigo?: string | null;   // código de ficha (Cxx) para closet/piernas
  receta?: RecetaParseada[];     // piezas de receta (cocina: hoja RECETA)
};

export type ResultadoParseo = {
  tipo: TipoExcel;
  unidades: UnidadParseada[];
  filasLeidas: number;
  torresDetectadas?: string[];   // valores raw del campo TORRE (closet/piernas)
  error?: string;
};

export type PreviewRow = Record<string, string | number | null>;

export type PreviewResponse = {
  tipo: TipoExcel;
  filasLeidas: number;
  unidades: number;
  preview: PreviewRow[];
  resumen: {
    totalItems: number;
    tipos: string[];
  };
  torres_detectadas: string[];
  error?: string;
};

export type ParserFn = (workbook: WorkBook, tipo: TipoExcel) => ResultadoParseo;

export function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function getField(row: Record<string, unknown>, names: string[]) {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  );
  for (const name of names) {
    const value = normalized.get(normalizeHeader(name));
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
}

export function toText(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function toNumber(value: unknown, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const clean = String(value).replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Igual que toNumber pero devuelve null cuando no hay valor numérico (para campos opcionales).
export function toNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const clean = String(value).replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  if (clean === "" || clean === "-") return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}
