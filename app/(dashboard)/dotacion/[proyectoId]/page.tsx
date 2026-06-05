import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EvaluacionBadge } from "@/components/ui/EvaluacionBadge";
import { prisma } from "@/lib/prisma";
import { AsignacionGantt } from "@/components/dotacion/AsignacionGantt";
import { CostoChart } from "@/components/dotacion/CostoChart";
import { ProyectoAvancePanel } from "@/components/dotacion/ProyectoAvancePanel";
import { ReporteDotacionBtn } from "@/components/reportes/ReporteDotacionBtn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

function monthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

type PersonalAsignado = {
  nombre: string;
  paterno: string;
  materno: string | null;
  cargo: string;
  tipo: "FORMATTO" | "SUBCONTRATO";
  evaluaciones: Array<{ nota: number }>;
};

type AsignacionProyecto = {
  id: string;
  personal: PersonalAsignado;
  cantidad: number;
  costoMensual: number;
  fechaInicio: Date;
  fechaFin: Date | null;
  desvincular: boolean;
};

type AvanceProyecto = {
  fecha: Date;
  porcentaje: number;
};

async function getProyecto(proyectoId: string) {
  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: {
        asignaciones: {
          orderBy: { fechaInicio: "asc" },
          include: {
            personal: {
              include: { evaluaciones: { where: { proyectoId }, orderBy: { creadoEn: "desc" }, take: 1 } },
            },
          },
        },
        avances: { orderBy: { fecha: "asc" } },
        unidades: { select: { id: true } },
      },
    });
    return { proyecto, error: null as string | null };
  } catch (error) {
    return { proyecto: null, error: error instanceof Error ? error.message : "No fue posible conectar con Prisma." };
  }
}

export default async function DotacionProyectoPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const { proyecto, error } = await getProyecto(proyectoId);

  if (!proyecto) {
    return (
      <>
        <PageHeader eyebrow="Dotacion" title="Proyecto" actions={<Link href="/dotacion" className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">Volver</Link>} />
        <div className="bg-white border border-border p-6 text-formatto-umber">{error ?? "Proyecto no encontrado."}</div>
      </>
    );
  }

  const asignaciones = proyecto.asignaciones as AsignacionProyecto[];
  const avancesProyecto = proyecto.avances as AvanceProyecto[];
  const unidadesProyecto = proyecto.unidades as Array<{ id: string }>;
  const activas = asignaciones.filter((asignacion: AsignacionProyecto) => !asignacion.fechaFin && !asignacion.desvincular);
  const costoFormatto = activas
    .filter((asignacion: AsignacionProyecto) => asignacion.personal.tipo === "FORMATTO")
    .reduce((sum: number, asignacion: AsignacionProyecto) => sum + asignacion.costoMensual, 0);
  const costoSubcontrato = activas
    .filter((asignacion: AsignacionProyecto) => asignacion.personal.tipo === "SUBCONTRATO")
    .reduce((sum: number, asignacion: AsignacionProyecto) => sum + asignacion.costoMensual, 0);
  const costosPorMes = new Map<string, { mes: string; formatto: number; subcontrato: number }>();

  for (const asignacion of asignaciones) {
    const mes = monthKey(asignacion.fechaInicio);
    const current = costosPorMes.get(mes) ?? { mes, formatto: 0, subcontrato: 0 };
    if (asignacion.personal.tipo === "SUBCONTRATO") current.subcontrato += asignacion.costoMensual;
    else current.formatto += asignacion.costoMensual;
    costosPorMes.set(mes, current);
  }

  const gantt = asignaciones.map((asignacion: AsignacionProyecto) => ({
    nombre: nombreCompleto(asignacion.personal),
    cargo: asignacion.personal.cargo,
    proyecto: proyecto.nombre,
    proyectoId: proyecto.id,
    fechaInicio: asignacion.fechaInicio.toISOString(),
    fechaFin: asignacion.fechaFin?.toISOString() ?? null,
    tipo: asignacion.personal.tipo,
  }));

  const avances = avancesProyecto.map((avance: AvanceProyecto) => ({
    fecha: avance.fecha.toISOString().slice(0, 10),
    porcentaje: avance.porcentaje,
  }));

  const reportePersonal = activas.map((asignacion: AsignacionProyecto) => ({
    nombre: nombreCompleto(asignacion.personal),
    cargo: asignacion.personal.cargo,
    tipo: asignacion.personal.tipo,
    fechaInicio: asignacion.fechaInicio.toISOString(),
    costoMensual: asignacion.costoMensual,
    evaluacion: asignacion.personal.evaluaciones[0]?.nota ?? null,
  }));
  const costoTotalReporte = activas.reduce((sum: number, asignacion: AsignacionProyecto) => sum + asignacion.costoMensual, 0);

  return (
    <>
      <PageHeader
        eyebrow={proyecto.nombre}
        title="Dotacion"
        actions={
          <>
            <ReporteDotacionBtn proyecto={proyecto.nombre} personal={reportePersonal} costoTotal={costoTotalReporte} fecha={new Date().toISOString()} />
            <Link href="/dotacion" className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">Volver</Link>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard eyebrow="Personal activo" value={activas.length} />
        <StatCard eyebrow="Costo FORMATTO" value={formatCLP(costoFormatto)} />
        <StatCard eyebrow="Costo SUBCONTRATO" value={formatCLP(costoSubcontrato)} />
      </div>

      <div className="grid grid-cols-1 gap-8 mb-8">
        <section className="space-y-4">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Gantt de asignaciones</p>
          <AsignacionGantt asignaciones={gantt} />
        </section>
        <section className="space-y-4">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Costo mensual</p>
          <CostoChart datos={Array.from(costosPorMes.values())} />
        </section>
        <ProyectoAvancePanel proyectoId={proyecto.id} unidadesTotales={unidadesProyecto.length} datos={avances} />
      </div>

      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha inicio</TableHead>
              <TableHead className="text-right">Costo mensual</TableHead>
              <TableHead>Evaluacion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asignaciones.length === 0 ? (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="p-8 text-center text-formatto-bark">Sin personal asignado.</TableCell></TableRow>
            ) : asignaciones.map((asignacion: AsignacionProyecto) => (
              <TableRow key={asignacion.id}>
                <TableCell className="font-semibold text-formatto-grafito">{nombreCompleto(asignacion.personal)}</TableCell>
                <TableCell>{asignacion.personal.cargo}</TableCell>
                <TableCell>{asignacion.personal.tipo}</TableCell>
                <TableCell>{formatDate(asignacion.fechaInicio)}</TableCell>
                <TableCell className="text-right">{formatCLP(asignacion.costoMensual)}</TableCell>
                <TableCell>
                  {asignacion.personal.evaluaciones[0]?.nota ? <EvaluacionBadge nota={asignacion.personal.evaluaciones[0].nota} showLabel /> : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
