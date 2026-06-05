import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { prisma } from "@/lib/prisma";
import { DotacionVista } from "@/components/dotacion/DotacionVista";
import type { DotacionRow } from "@/components/dotacion/DotacionTable";
import type { EstadoPersonal, TipoContrato, TipoPersonal } from "@prisma/client";

export const dynamic = "force-dynamic";

function nombreCompleto(personal: { nombre: string; paterno: string; materno: string | null }) {
  return [personal.nombre, personal.paterno, personal.materno].filter(Boolean).join(" ");
}

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

type ProyectoOption = { id: string; nombre: string };

type AsignacionPersonalRow = {
  proyectoId: string;
  fechaFin: Date | null;
  desvincular: boolean;
  costoMensual: number;
  proyecto: ProyectoOption;
};

type PersonalRow = {
  id: string;
  nombre: string;
  paterno: string;
  materno: string | null;
  rut: string;
  cargo: string;
  tipoContrato: TipoContrato;
  tipo: TipoPersonal;
  estado: EstadoPersonal;
  asignaciones: AsignacionPersonalRow[];
  evaluaciones: Array<{ nota: number }>;
};

async function getData() {
  try {
    const [personal, proyectos] = await Promise.all([
      prisma.personal.findMany({
        orderBy: [{ estado: "asc" }, { nombre: "asc" }],
        include: {
          asignaciones: {
            orderBy: { fechaInicio: "desc" },
            include: { proyecto: { select: { id: true, nombre: true } } },
          },
          evaluaciones: { orderBy: { creadoEn: "desc" }, take: 1 },
        },
      }),
      prisma.proyecto.findMany({
        where: { estado: "ACTIVO" },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
    ]);
    return { personal, proyectos, error: null as string | null };
  } catch (error) {
    return {
      personal: [],
      proyectos: [],
      error: error instanceof Error ? error.message : "No fue posible conectar con Prisma.",
    };
  }
}

export default async function DotacionPage() {
  const { personal, proyectos, error } = await getData();
  const personalRows = personal as PersonalRow[];
  const proyectoOptions = proyectos as ProyectoOption[];
  const asignacionesActivas = personalRows.flatMap((row: PersonalRow) =>
    row.asignaciones.filter((asignacion: AsignacionPersonalRow) => !asignacion.fechaFin && !asignacion.desvincular),
  );
  const totalActivo = personalRows.filter((row: PersonalRow) => row.estado === "ACTIVO").length;
  const proyectosConPersonal = new Set(asignacionesActivas.map((asignacion: AsignacionPersonalRow) => asignacion.proyectoId)).size;
  const costoTotal = asignacionesActivas.reduce((sum: number, asignacion: AsignacionPersonalRow) => sum + asignacion.costoMensual, 0);

  const rows: DotacionRow[] = personalRows.map((row: PersonalRow) => {
    const actual = row.asignaciones.find((asignacion: AsignacionPersonalRow) => !asignacion.fechaFin && !asignacion.desvincular) ?? null;
    return {
      id: row.id,
      nombreCompleto: nombreCompleto(row),
      rut: row.rut,
      cargo: row.cargo,
      tipoContrato: row.tipoContrato,
      tipo: row.tipo,
      estado: row.estado,
      proyectoActual: actual ? { id: actual.proyecto.id, nombre: actual.proyecto.nombre } : null,
      ultimaEvaluacion: row.evaluaciones[0]?.nota ?? null,
      costoMensual: actual?.costoMensual ?? 0,
    };
  });

  return (
    <>
      <PageHeader eyebrow="Personal" title="Dotacion" />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard eyebrow="Total personal activo" value={totalActivo} />
        <StatCard eyebrow="Proyectos con personal" value={proyectosConPersonal} />
        <StatCard eyebrow="Costo mensual total" value={formatCLP(costoTotal)} />
      </div>

      {error && (
        <div className="mb-4 bg-white border border-border p-4 text-sm text-formatto-umber">
          {error}
        </div>
      )}

      <DotacionVista rows={rows} proyectos={proyectoOptions} />
    </>
  );
}
