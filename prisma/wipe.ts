// @ts-nocheck
// Vacía TODA la data operativa de la BD, dejando solo los usuarios de auth (User).
// Respeta el orden de foreign keys. Atómico dentro de una transacción.
// Uso: npx tsx prisma/wipe.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: false });

const rawUrl = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "").replace(/[?&]sslmode=[^&]*/g, "");
const pool = new Pool({
  connectionString: rawUrl,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Borrado secuencial (sin transacción interactiva: el pooler de Supabase la
  // rechaza con P2028). Orden: hijos antes que padres para respetar FKs.
  // deleteMany es idempotente, así que el script es re-ejecutable si falla a mitad.
  if (prisma.recetaItem) await prisma.recetaItem.deleteMany();      // existe a partir de Fase 2
  await prisma.historialEtapa.deleteMany();
  await prisma.itemInstalacion.deleteMany();
  await prisma.unidad.deleteMany();
  await prisma.archivoExcel.deleteMany();
  await prisma.paradaRuta.deleteMany();
  await prisma.rutaVisita.deleteMany();
  await prisma.asignacionSupervisor.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.avanceObra.deleteMany();
  await prisma.subcontrato.deleteMany();
  await prisma.asignacionPersonal.deleteMany();
  await prisma.proyecto.deleteMany();
  await prisma.supervisor.deleteMany();
  await prisma.personal.deleteMany();
  console.log("Wipe completado. La BD queda solo con usuarios de auth.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
