// Test de integración de persistencia: parsea el Excel real de cocina y lo persiste
// en un proyecto temporal, verifica conteos y limpia. Ejecutar:
//   npx tsx lib/excel/__tests__/run-persist.ts
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
import { parseWorkbookFromBuffer } from "../detector";
import { persistirCargaExcel } from "../persistir";

config({ path: ".env" });
config({ path: ".env.local", override: false });

const rawUrl = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "").replace(/[?&]sslmode=[^&]*/g, "");
const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: rawUrl, ssl: { rejectUnauthorized: false } })) });

const base = "Base de Datos - APP/Tasco";

async function main() {
  let fallos = 0;
  const ok = (label: string, cond: boolean, det: string) => {
    console.log(`${cond ? "✓" : "✗"} ${label} — ${det}`);
    if (!cond) fallos++;
  };

  const proyecto = await prisma.proyecto.create({
    data: { nombre: "ZZZ_TEST_CARGA", constructora: "TEST", estado: "ACTIVO" },
    select: { id: true },
  });

  try {
    // Solo NV_RTA + RECETA (evita leer las ~20 hojas pesadas).
    const buf = readFileSync(`${base}/COCINA/BD_COCINA_GOLA - TASCO_VIVE QUINTA_V5.xlsx`);
    const result = parseWorkbookFromBuffer(buf);
    ok("parse tipo COCINA", result.tipo === "COCINA", result.tipo);

    const t0 = Date.now();
    const res = await persistirCargaExcel(prisma, { proyectoId: proyecto.id, result, modo: "agregar", torresConfirmadas: 1 });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`   persistencia en ${secs}s →`, JSON.stringify(res));

    const unidades = await prisma.unidad.count({ where: { proyectoId: proyecto.id } });
    const items = await prisma.itemInstalacion.count({ where: { unidad: { proyectoId: proyecto.id } } });
    const recetas = await prisma.recetaItem.count({ where: { item: { unidad: { proyectoId: proyecto.id } } } });
    const cocinaItems = await prisma.itemInstalacion.count({ where: { unidad: { proyectoId: proyecto.id }, tipoMueble: "COCINA" } });

    ok("unidades persistidas = 150", unidades === 150, `${unidades}`);
    ok("items persistidos > 0", items > 0, `${items}`);
    ok("recetas persistidas > 0", recetas > 0, `${recetas}`);
    ok("tipoMueble COCINA aplicado", cocinaItems === items, `${cocinaItems}/${items}`);

    // torre = null (1 torre confirmada)
    const conTorre = await prisma.unidad.count({ where: { proyectoId: proyecto.id, NOT: { torre: null } } });
    ok("torres normalizadas a null", conTorre === 0, `${conTorre} con torre`);
  } finally {
    // Limpieza del proyecto temporal.
    const ids = (await prisma.unidad.findMany({ where: { proyectoId: proyecto.id }, select: { id: true } })).map((u) => u.id);
    const itemIds = ids.length ? (await prisma.itemInstalacion.findMany({ where: { unidadId: { in: ids } }, select: { id: true } })).map((i) => i.id) : [];
    if (itemIds.length) await prisma.recetaItem.deleteMany({ where: { itemId: { in: itemIds } } });
    if (itemIds.length) await prisma.itemInstalacion.deleteMany({ where: { id: { in: itemIds } } });
    if (ids.length) await prisma.unidad.deleteMany({ where: { id: { in: ids } } });
    await prisma.archivoExcel.deleteMany({ where: { proyectoId: proyecto.id } });
    await prisma.proyecto.delete({ where: { id: proyecto.id } });
    console.log("   (proyecto temporal limpiado)");
  }

  console.log(fallos === 0 ? "\nPERSISTENCIA OK" : `\n${fallos} CHECK(S) FALLARON`);
  await prisma.$disconnect();
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
