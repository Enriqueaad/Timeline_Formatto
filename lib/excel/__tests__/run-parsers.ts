// Verificación de parsers contra los Excel reales de VIVE QUINTA (TASCO).
// Ejecutar: npx tsx lib/excel/__tests__/run-parsers.ts
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { parseWorkbook } from "../detector";
import { parseFicha } from "../parsers/ficha";

const base = "Base de Datos - APP/Tasco";
// Leer solo las hojas necesarias: el workbook de cocina tiene ~20 hojas y leerlas
// todas consume varios GB. Los parsers solo usan estas hojas.
const rd = (p: string, sheets: string[]) =>
  XLSX.read(readFileSync(p), { type: "buffer", cellDates: true, sheets });

let fallos = 0;
function check(label: string, cond: boolean, detalle: string) {
  console.log(`${cond ? "✓" : "✗"} ${label} — ${detalle}`);
  if (!cond) fallos++;
}

// 1) COCINA
const coc = parseWorkbook(rd(`${base}/COCINA/BD_COCINA_GOLA - TASCO_VIVE QUINTA_V5.xlsx`, ["NV_RTA", "RECETA"]));
const cocItems = coc.unidades.reduce((s, u) => s + u.items.length, 0);
const cocConReceta = coc.unidades.flatMap((u) => u.items).filter((i) => (i.receta?.length ?? 0) > 0).length;
check("COCINA tipo", coc.tipo === "COCINA", coc.tipo);
check("COCINA unidades ~150", coc.unidades.length >= 140 && coc.unidades.length <= 160, `${coc.unidades.length} unidades`);
check("COCINA items > 0", cocItems > 0, `${cocItems} items`);
check("COCINA tipoMueble", coc.unidades[0]?.items[0]?.tipoMueble === "COCINA", coc.unidades[0]?.items[0]?.tipoMueble ?? "?");
check("COCINA recetas enlazadas", cocConReceta > 0, `${cocConReceta} items con receta`);

// 2) CLOSET INTERIOR
const clo = parseWorkbook(rd(`${base}/CLOSET/INTERIOR CLOSET_PROYECTO VIVE QUINTA  _TASCO.xlsm`, ["CUADRO"]));
const cloSub = new Set(clo.unidades.flatMap((u) => u.items.map((i) => i.tipoMueble)));
check("CLOSET tipo", clo.tipo === "CLOSET_INTERIOR", clo.tipo);
check("CLOSET unidades ~150", clo.unidades.length >= 140 && clo.unidades.length <= 160, `${clo.unidades.length} unidades`);
check("CLOSET distingue INTERIOR/QUINC", cloSub.has("CLOSET_INTERIOR") && cloSub.has("QUINCALLERIA"), [...cloSub].join(","));
check("CLOSET torresDetectadas", (clo.torresDetectadas?.length ?? 0) > 0, `${clo.torresDetectadas?.length} valores`);
check("CLOSET fichaCodigo presente", Boolean(clo.unidades[0]?.items[0]?.fichaCodigo), clo.unidades[0]?.items[0]?.fichaCodigo ?? "?");

// 3) PIERNAS
const pie = parseWorkbook(rd(`${base}/PIERNAS/PIERNAS CLOSET_PROYECTO VIVE QUINTA  _TASCO.xlsm`, ["CUADRO"]));
check("PIERNAS tipo", pie.tipo === "PIERNAS", pie.tipo);
check("PIERNAS unidades ~42", pie.unidades.length >= 30 && pie.unidades.length <= 60, `${pie.unidades.length} unidades`);

// 4) FICHA C02
const fic = parseFicha(rd(`${base}/CLOSET/FICHAS/C02_ VERTICAL 1876x525x18 -     TEXTIL BEIGE.xlsm`, ["PLANTILLA_FLEXIBLE"]));
check("FICHA C02 ≥1 pieza", fic.receta.length >= 1, `${fic.receta.length} piezas; mueble=${fic.mueble.producto ?? "?"}`);
if (fic.receta[0]) console.log("   pieza ejemplo:", JSON.stringify(fic.receta[0]));

console.log(fallos === 0 ? "\nTODOS LOS CHECKS OK" : `\n${fallos} CHECK(S) FALLARON`);
process.exit(fallos === 0 ? 0 : 1);
