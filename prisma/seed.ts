// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
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

// Seed mínimo: solo usuarios de autenticación. La data operativa (proyectos,
// unidades, items, dotación, supervisores, rutas) se carga desde la app con
// Excel reales. Para vaciar la BD usar `prisma/wipe.ts`.
async function seedUsers() {
  const passwordHash = await bcrypt.hash("formatto2026", 10);
  await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@formatto.cl" },
      update: { name: "Admin Formatto", role: "ADMIN", activo: true },
      create: { email: "admin@formatto.cl", name: "Admin Formatto", passwordHash, role: "ADMIN", activo: true },
    }),
    prisma.user.upsert({
      where: { email: "enrique.arenas@formatto.cl" },
      update: { name: "Enrique Arenas", role: "ADMIN", activo: true },
      create: { email: "enrique.arenas@formatto.cl", name: "Enrique Arenas", passwordHash, role: "ADMIN", activo: true },
    }),
  ]);
}

async function main() {
  await seedUsers();
  console.log("Seed completado (solo usuarios de auth).");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
