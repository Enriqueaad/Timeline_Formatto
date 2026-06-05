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

const baseDate = new Date("2026-06-01T12:00:00.000Z");

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

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

async function seedProjects() {
  const projects = [
    ["seed-proy-1", "Vista Aguila", "Formatto + Subcontrato", "ACTIVO", "Torre A"],
    ["seed-proy-2", "Puerta Florida", "Constructora Maestra", "ACTIVO", "Torre Norte"],
    ["seed-proy-3", "Puntas Gruesa", "Inmobiliaria Costa Sur", "ACTIVO", "Etapa 1"],
    ["seed-proy-4", "Chicauma 9.1", "Socovesa", "ACTIVO", "Torre 9"],
    ["seed-proy-5", "Cachapoal", "Almagro", "ACTIVO", "Torre B"],
    ["seed-proy-6", "Viento Norte A1-A2", "Aconcagua", "ACTIVO", "A1-A2"],
    ["seed-proy-7", "Jardin Marbella", "Inmobiliaria Mar", "PAUSADO", "Torre Jardin"],
    ["seed-proy-8", "Los Cipreses", "Paz", "TERMINADO", "Torre Sur"],
  ];

  return Promise.all(
    projects.map(([id, nombre, constructora, estado, torre], index) =>
      prisma.proyecto.upsert({
        where: { id },
        update: { nombre, constructora, estado, torre },
        create: {
          id,
          nombre,
          constructora,
          estado,
          torre,
          finEstimado: addMonths(baseDate, index + 2),
          observacion: "Seed operativo Formatto",
        },
      }),
    ),
  );
}

async function seedSupervisores() {
  const supervisores = [
    ["seed-sup-1", "Pablo Silva", "15.678.901-2", "pablo.silva@formatto.cl", "+56 9 8765 4321"],
    ["seed-sup-2", "Jose Carrizo", "16.234.567-8", "jose.carrizo@formatto.cl", "+56 9 9123 4567"],
    ["seed-sup-3", "Ana Robinson", "17.345.678-9", "ana.robinson@formatto.cl", "+56 9 9234 5678"],
    ["seed-sup-4", "Marcos Valenzuela", "18.456.789-0", "marcos.valenzuela@formatto.cl", "+56 9 9345 6789"],
  ];

  return Promise.all(
    supervisores.map(([id, nombre, rut, email, telefono]) =>
      prisma.supervisor.upsert({
        where: { id },
        update: { nombre, rut, email, telefono, activo: true },
        create: { id, nombre, rut, email, telefono, activo: true },
      }),
    ),
  );
}

async function seedPersonal() {
  const personas = [
    ["seed-per-01", "12.345.678-9", "Carlos", "Rojas", "Molina", "Instalador Senior", "FORMATTO", "INDEFINIDO"],
    ["seed-per-02", "13.456.789-0", "Felipe", "Aliste", "Munoz", "Instalador", "FORMATTO", "PLAZO_FIJO"],
    ["seed-per-03", "14.567.890-1", "Victor", "Acosta", "Reyes", "Maestro Mueblista", "FORMATTO", "INDEFINIDO"],
    ["seed-per-04", "15.678.901-3", "Cristian", "Fuentes", "Lopez", "Ayudante", "FORMATTO", "PLAZO_FIJO"],
    ["seed-per-05", "16.789.012-4", "Mauricio", "Tapia", "Vera", "Instalador", "FORMATTO", "INDEFINIDO"],
    ["seed-per-06", "17.890.123-5", "Javier", "Araya", "Soto", "Instalador", "FORMATTO", "PLAZO_FIJO"],
    ["seed-per-07", "18.901.234-6", "Luis", "Navarro", "Pizarro", "Instalador Senior", "FORMATTO", "INDEFINIDO"],
    ["seed-per-08", "19.012.345-7", "Sebastian", "Mena", "Castro", "Ayudante", "FORMATTO", "PLAZO_FIJO"],
    ["seed-per-09", "20.123.456-8", "Diego", "Cortes", "Riquelme", "Instalador", "FORMATTO", "INDEFINIDO"],
    ["seed-per-10", "21.234.567-9", "Nicolas", "Bravo", "Saez", "Maestro Mueblista", "FORMATTO", "INDEFINIDO"],
    ["seed-per-11", "22.345.678-0", "Equipo Mueble Gava", "Subcontrato", null, "Cuadrilla Subcontrato", "SUBCONTRATO", "PLAZO_FIJO"],
    ["seed-per-12", "23.456.789-1", "Equipo Robles", "Subcontrato", null, "Cuadrilla Subcontrato", "SUBCONTRATO", "PLAZO_FIJO"],
    ["seed-per-13", "24.567.890-2", "Equipo San Martin", "Subcontrato", null, "Cuadrilla Subcontrato", "SUBCONTRATO", "PLAZO_FIJO"],
    ["seed-per-14", "25.678.901-3", "Equipo Marbella", "Subcontrato", null, "Cuadrilla Subcontrato", "SUBCONTRATO", "PLAZO_FIJO"],
    ["seed-per-15", "26.789.012-4", "Equipo Cipreses", "Subcontrato", null, "Cuadrilla Subcontrato", "SUBCONTRATO", "PLAZO_FIJO"],
    ["seed-per-16", "27.890.123-5", "Pedro", "Figueroa", "Diaz", "Instalador", "FORMATTO", "INDEFINIDO"],
    ["seed-per-17", "28.901.234-6", "Hector", "Leiva", "Campos", "Ayudante", "FORMATTO", "PLAZO_FIJO"],
    ["seed-per-18", "29.012.345-7", "Matias", "Morales", "Pena", "Instalador", "FORMATTO", "INDEFINIDO"],
    ["seed-per-19", "30.123.456-8", "Oscar", "Salinas", "Ortega", "Maestro Mueblista", "FORMATTO", "INDEFINIDO"],
    ["seed-per-20", "31.234.567-9", "Equipo Norte", "Subcontrato", null, "Cuadrilla Subcontrato", "SUBCONTRATO", "PLAZO_FIJO"],
  ];

  return Promise.all(
    personas.map(([id, rut, nombre, paterno, materno, cargo, tipo, tipoContrato]) =>
      prisma.personal.upsert({
        where: { id },
        update: { rut, nombre, paterno, materno, cargo, tipo, tipoContrato, estado: "ACTIVO" },
        create: { id, rut, nombre, paterno, materno, cargo, tipo, tipoContrato, estado: "ACTIVO" },
      }),
    ),
  );
}

async function seedAsignaciones() {
  const asignaciones = [
    ["seed-asig-01", "seed-per-01", "seed-proy-1", "seed-sup-1", 1, null, 1450000, 0],
    ["seed-asig-02", "seed-per-02", "seed-proy-1", "seed-sup-1", 1, null, 1250000, 0],
    ["seed-asig-03", "seed-per-11", "seed-proy-1", "seed-sup-1", 1, 3, 2200000, 0],
    ["seed-asig-04", "seed-per-03", "seed-proy-2", "seed-sup-4", 1, null, 1380000, -1],
    ["seed-asig-05", "seed-per-04", "seed-proy-2", "seed-sup-4", 1, null, 980000, -1],
    ["seed-asig-06", "seed-per-12", "seed-proy-3", "seed-sup-2", 1, 3, 745000, -2],
    ["seed-asig-07", "seed-per-05", "seed-proy-4", "seed-sup-2", 1, null, 1320000, -1],
    ["seed-asig-08", "seed-per-06", "seed-proy-4", "seed-sup-2", 1, null, 1180000, 0],
    ["seed-asig-09", "seed-per-13", "seed-proy-5", "seed-sup-2", 1, 4, 4100000, -2],
    ["seed-asig-10", "seed-per-07", "seed-proy-6", "seed-sup-1", 1, null, 1500000, -3],
    ["seed-asig-11", "seed-per-08", "seed-proy-6", "seed-sup-1", 1, null, 990000, -1],
    ["seed-asig-12", "seed-per-14", "seed-proy-7", "seed-sup-3", 1, 4, 4700000, -3],
    ["seed-asig-13", "seed-per-15", "seed-proy-8", "seed-sup-3", 1, 7, 8100000, -4],
    ["seed-asig-14", "seed-per-09", "seed-proy-3", "seed-sup-2", 1, null, 1280000, 0],
    ["seed-asig-15", "seed-per-10", "seed-proy-4", "seed-sup-2", 1, null, 1420000, -2],
    ["seed-asig-16", "seed-per-16", "seed-proy-5", "seed-sup-2", 1, null, 1260000, -1],
    ["seed-asig-17", "seed-per-17", "seed-proy-6", "seed-sup-1", 1, null, 920000, 0],
    ["seed-asig-18", "seed-per-18", "seed-proy-2", "seed-sup-4", 1, null, 1210000, 0],
    ["seed-asig-19", "seed-per-19", "seed-proy-8", "seed-sup-3", 1, null, 1480000, -4],
    ["seed-asig-20", "seed-per-20", "seed-proy-6", "seed-sup-1", 1, 5, 5800000, -1],
  ];

  return Promise.all(
    asignaciones.map(([id, personalId, proyectoId, supervisorId, cantidad, cantSubcontrato, costoMensual, offset]) =>
      prisma.asignacionPersonal.upsert({
        where: { id },
        update: { personalId, proyectoId, supervisorId, cantidad, cantSubcontrato, costoMensual, fechaInicio: addMonths(baseDate, offset), fechaFin: null, desvincular: false },
        create: { id, personalId, proyectoId, supervisorId, cantidad, cantSubcontrato, costoMensual, fechaInicio: addMonths(baseDate, offset), desvincular: false },
      }),
    ),
  );
}

async function seedUnidadesItems() {
  const unidades = [];
  for (let p = 1; p <= 8; p++) {
    for (let d = 1; d <= 3; d++) {
      const unidadId = `seed-unidad-${p}-${d}`;
      unidades.push(
        prisma.unidad.upsert({
          where: { id: unidadId },
          update: { proyectoId: `seed-proy-${p}`, piso: `${d + 1}`, dpto: `${(d + 1) * 100 + d}`, torre: p % 2 === 0 ? "B" : "A", tipo: d % 2 === 0 ? "Cocina" : "Cocina + Closet" },
          create: { id: unidadId, proyectoId: `seed-proy-${p}`, piso: `${d + 1}`, dpto: `${(d + 1) * 100 + d}`, torre: p % 2 === 0 ? "B" : "A", tipo: d % 2 === 0 ? "Cocina" : "Cocina + Closet" },
        }),
      );

      const etapas = ["PEDIDO", "FABRICACION", "DESPACHO", "INSTALACION", "ENTREGA_CONFORME"];
      for (let i = 1; i <= 3; i++) {
        const etapa = etapas[Math.min(4, (p + d + i) % etapas.length)];
        unidades.push(
          prisma.itemInstalacion.upsert({
            where: { id: `seed-item-${p}-${d}-${i}` },
            update: {
              unidadId,
              sku: `FMT-${p}${d}${i}`,
              descripcion: i === 1 ? "Modulo bajo cocina" : i === 2 ? "Cubierta y remates" : "Frente closet",
              subconjunto: i === 3 ? "Closet" : "Cocina",
              cantidad: i,
              costo: 180000 * i,
              etapa,
            },
            create: {
              id: `seed-item-${p}-${d}-${i}`,
              unidadId,
              sku: `FMT-${p}${d}${i}`,
              descripcion: i === 1 ? "Modulo bajo cocina" : i === 2 ? "Cubierta y remates" : "Frente closet",
              subconjunto: i === 3 ? "Closet" : "Cocina",
              cantidad: i,
              costo: 180000 * i,
              etapa,
            },
          }),
        );
      }
    }
  }
  return Promise.all(unidades);
}

async function seedAvancesEvaluaciones() {
  const writes = [];
  for (let p = 1; p <= 8; p++) {
    for (let m = 0; m < 4; m++) {
      writes.push(
        prisma.avanceObra.upsert({
          where: { id: `seed-avance-${p}-${m}` },
          update: {
            proyectoId: `seed-proy-${p}`,
            fecha: addMonths(baseDate, m - 3),
            porcentaje: Math.min(100, 12 + p * 7 + m * 11),
            unidadesCompletadas: Math.min(9, p + m * 2),
            unidadesTotales: 9,
            registradoPor: "Seed Formatto",
            observacion: "Avance de muestra",
          },
          create: {
            id: `seed-avance-${p}-${m}`,
            proyectoId: `seed-proy-${p}`,
            fecha: addMonths(baseDate, m - 3),
            porcentaje: Math.min(100, 12 + p * 7 + m * 11),
            unidadesCompletadas: Math.min(9, p + m * 2),
            unidadesTotales: 9,
            registradoPor: "Seed Formatto",
            observacion: "Avance de muestra",
          },
        }),
      );
    }
  }

  for (let i = 1; i <= 20; i++) {
    const person = String(i).padStart(2, "0");
    const proyecto = ((i - 1) % 8) + 1;
    writes.push(
      prisma.evaluacion.upsert({
        where: { id: `seed-eval-${person}` },
        update: {
          personalId: `seed-per-${person}`,
          proyectoId: `seed-proy-${proyecto}`,
          nota: 3 + (i % 3),
          periodo: baseDate,
          observacion: "Evaluacion inicial de seed",
          evaluadoPor: "Admin Formatto",
        },
        create: {
          id: `seed-eval-${person}`,
          personalId: `seed-per-${person}`,
          proyectoId: `seed-proy-${proyecto}`,
          nota: 3 + (i % 3),
          periodo: baseDate,
          observacion: "Evaluacion inicial de seed",
          evaluadoPor: "Admin Formatto",
        },
      }),
    );
  }
  return Promise.all(writes);
}

async function seedRutas() {
  const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

  // Primero crear las RutaVisita
  await Promise.all(
    Array.from({ length: 4 }, (_, i) => i + 1).map((s) =>
      prisma.rutaVisita.upsert({
        where: { id: `seed-ruta-${s}` },
        update: { supervisorId: `seed-sup-${s}`, semana: baseDate },
        create: { id: `seed-ruta-${s}`, supervisorId: `seed-sup-${s}`, semana: baseDate },
      }),
    ),
  );

  // Luego crear las ParadaRuta (ya existen las rutas padre)
  const paradas = [];
  for (let s = 1; s <= 4; s++) {
    for (let d = 0; d < dias.length; d++) {
      paradas.push(
        prisma.paradaRuta.upsert({
          where: { id: `seed-parada-${s}-${d}` },
          update: {
            rutaId: `seed-ruta-${s}`,
            proyectoId: `seed-proy-${((s + d - 1) % 8) + 1}`,
            orden: d + 1,
            diaVisita: dias[d],
            horaEstimada: `${9 + d}:00`,
            observacion: "Revision de avance y dotacion",
          },
          create: {
            id: `seed-parada-${s}-${d}`,
            rutaId: `seed-ruta-${s}`,
            proyectoId: `seed-proy-${((s + d - 1) % 8) + 1}`,
            orden: d + 1,
            diaVisita: dias[d],
            horaEstimada: `${9 + d}:00`,
            observacion: "Revision de avance y dotacion",
          },
        }),
      );
    }
  }
  return Promise.all(paradas);
}

async function main() {
  await seedUsers();
  await seedProjects();
  await seedSupervisores();
  await seedPersonal();
  await seedAsignaciones();
  await seedUnidadesItems();
  await seedAvancesEvaluaciones();
  await seedRutas();
  console.log("Seed completado.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
