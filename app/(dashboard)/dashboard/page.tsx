import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

function monthKey(value: Date) {
  return value.toISOString().slice(0, 7);
}

type AsignacionDashboard = {
  cantidad: number;
  costoMensual: number;
  fechaInicio: Date;
  fechaFin: Date | null;
};

type ProyectoDashboard = {
  nombre: string;
  avances: Array<{ porcentaje: number }>;
};

export default async function DashboardPage() {
  const session = await auth();

  let proyectosActivos = 0;
  let personalEnObra = 0;
  let costoTotal = 0;
  let contratosPorVencer = 0;
  let proyectosAvance: Array<{ nombre: string; avance: number }> = [];
  let costosMensuales: Array<{ mes: string; costo: number }> = [];

  try {
    const [proyectos, proyectosDetalle, asignaciones] = await Promise.all([
      prisma.proyecto.count({ where: { estado: "ACTIVO" } }),
      prisma.proyecto.findMany({
        where: { estado: "ACTIVO" },
        orderBy: { nombre: "asc" },
        select: {
          nombre: true,
          avances: {
            orderBy: { fecha: "asc" },
            select: { porcentaje: true },
          },
        },
      }),
      prisma.asignacionPersonal.findMany({
        where: { desvincular: false },
        select: { cantidad: true, costoMensual: true, fechaInicio: true, fechaFin: true },
      }),
    ]);

    const asignacionesTyped = asignaciones as AsignacionDashboard[];
    const asignacionesActivas = asignacionesTyped.filter((asignacion: AsignacionDashboard) => !asignacion.fechaFin);
    proyectosActivos = proyectos;
    personalEnObra = asignacionesActivas.reduce((sum: number, asignacion: AsignacionDashboard) => sum + asignacion.cantidad, 0);
    costoTotal = asignacionesActivas.reduce((sum: number, asignacion: AsignacionDashboard) => sum + asignacion.costoMensual, 0);
    const proyectosTyped = proyectosDetalle as ProyectoDashboard[];
    proyectosAvance = proyectosTyped.map((proyecto: ProyectoDashboard) => ({
      nombre: proyecto.nombre,
      avance: proyecto.avances.at(-1)?.porcentaje ?? 0,
    }));

    const costosPorMes = new Map<string, number>();
    for (const asignacion of asignacionesTyped) {
      const mes = monthKey(asignacion.fechaInicio);
      costosPorMes.set(mes, (costosPorMes.get(mes) ?? 0) + asignacion.costoMensual);
    }
    costosMensuales = Array.from(costosPorMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, costo]) => ({ mes, costo }));

    const en30dias = new Date();
    en30dias.setDate(en30dias.getDate() + 30);
    contratosPorVencer = await prisma.asignacionPersonal.count({
      where: {
        fechaFin: { lte: en30dias, gte: new Date() },
        desvincular: false,
      },
    });
  } catch {
    // DB no conectada aun: muestra ceros y graficos vacios.
  }

  const formatCLP = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Vista General"
        subtitle={`Bienvenido, ${session?.user?.name ?? session?.user?.email}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <StatCard eyebrow="Proyectos Activos" value={proyectosActivos} />
        <StatCard eyebrow="Personal en Obra" value={personalEnObra} />
        <StatCard eyebrow="Costo Total Dotacion" value={formatCLP(costoTotal)} />
        <StatCard
          eyebrow="Contratos por Vencer"
          value={contratosPorVencer}
          valueColor={contratosPorVencer > 0 ? "rojo" : "default"}
          sub="proximos 30 dias"
        />
      </div>

      <DashboardCharts avances={proyectosAvance} costos={costosMensuales} />
    </>
  );
}
