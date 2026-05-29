import fs from "node:fs";
import path from "node:path";
import readXlsxFile from "read-excel-file/node";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const excelPath = path.join(root, "base_excel", "DOTACION DE PERSONAL 27-05.xlsx");
const sheetName = "TABLA CLAUDE";

function loadEnv() {
  const env = {};
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return env;
}

function cleanText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(" A1 - A2", " A1-A2")
    .replace(" B3 - B4", " B3-B4");
}

function cleanState(value) {
  const state = cleanText(value).toUpperCase();
  return ["PROCESO", "CIERRE", "PILOTO", "DESARROLLO", "SUBCONTRATO"].includes(state) ? state : "PROCESO";
}

function toInt(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(/\D+/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function toIsoDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = cleanText(value);
  if (!text) return null;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

function rowObject(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null]));
}

function pick(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return null;
}

function fullName(row) {
  return [row.Nombre, row.Paterno, row.Materno].map(cleanText).filter(Boolean).join(" ");
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

const workbookRows = await readXlsxFile(excelPath, { getSheets: true });
const selectedSheet = workbookRows.find((sheet) => cleanText(sheet.sheet).toUpperCase() === sheetName);
if (!selectedSheet) throw new Error(`No se encontro la hoja ${sheetName}`);

const rows = selectedSheet.data;
const headers = rows[0].map(cleanText);
const allowedTypes = new Set(["FORMATTO", "SUB CONTRATO"]);
const records = rows
  .slice(1)
  .map((row) => rowObject(headers, row))
  .filter((row) => {
    const tipo = cleanText(row.TIPO).toUpperCase();
    const obra = cleanText(row.OBRA).toUpperCase();
    return allowedTypes.has(tipo) && obra && obra !== "SIN OBRA";
  });

const obraMap = new Map();
for (const row of records) {
  const nombre = cleanText(row.OBRA);
  const fin = toIsoDate(pick(row, "Fin Proyecto", "Fin proyecto"));
  if (!nombre || !fin) continue;
  if (!obraMap.has(nombre)) {
    obraMap.set(nombre, {
      nombre,
      supervisor: cleanText(row.SUPERVISOR) || null,
      estado: cleanState(pick(row, "Estado Proyecto", "Estado proyecto")),
      fin
    });
  }
}

const obras = [...obraMap.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function assertNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

await assertNoError(await supabase.from("personal").delete().neq("id", "00000000-0000-0000-0000-000000000000"), "limpiar personal");
await assertNoError(await supabase.from("subcontratos").delete().neq("id", "00000000-0000-0000-0000-000000000000"), "limpiar subcontratos");
await assertNoError(await supabase.from("obras").delete().neq("id", "00000000-0000-0000-0000-000000000000"), "limpiar obras");

const insertedObras = await assertNoError(
  await supabase.from("obras").insert(obras).select("id,nombre,supervisor,estado,fin"),
  "insertar obras"
);
const obraIdByName = new Map(insertedObras.map((obra) => [obra.nombre, obra.id]));

const personal = records
  .filter((row) => cleanText(row.TIPO).toUpperCase() === "FORMATTO")
  .map((row) => {
    const obra = cleanText(row.OBRA);
    return {
      obra_id: obraIdByName.get(obra) || null,
      obra_nombre: obra,
      nombre: fullName(row),
      cargo: cleanText(row.Cargo),
      cant: toInt(row.CANTIDAD, 1),
      costo: toInt(row.COSTO, 0),
      eval: cleanText(row.EVALUACION).toUpperCase() || "B",
      supervisor: cleanText(row.SUPERVISOR),
      fin: toIsoDate(pick(row, "Fin Proyecto", "Fin proyecto"))
    };
  });

const subcontratos = records
  .filter((row) => cleanText(row.TIPO).toUpperCase() === "SUB CONTRATO")
  .map((row) => {
    const obra = cleanText(row.OBRA);
    return {
      obra_id: obraIdByName.get(obra) || null,
      obra_nombre: obra,
      nombre: fullName(row),
      cant: toInt(row.CANTIDAD, 0),
      fin: toIsoDate(pick(row, "Fin Proyecto", "Fin proyecto"))
    };
  });

if (personal.length) {
  await assertNoError(await supabase.from("personal").insert(personal), "insertar personal");
}
if (subcontratos.length) {
  await assertNoError(await supabase.from("subcontratos").insert(subcontratos), "insertar subcontratos");
}

await assertNoError(
  await supabase.from("configuracion").upsert({ key: "cutoffDate", value: "2026-05-27" }),
  "actualizar configuracion"
);

console.log(
  JSON.stringify(
    {
      sheet: sheetName,
      obras: obras.length,
      personal: personal.length,
      subcontratos: subcontratos.length,
      subcontratosDotacion: subcontratos.reduce((sum, sub) => sum + sub.cant, 0)
    },
    null,
    2
  )
);
