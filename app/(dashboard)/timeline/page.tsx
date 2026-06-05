import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { TimelineRecharts } from "@/components/dotacion/TimelineRecharts";

export const dynamic = "force-dynamic";

async function getTimeline() {
  try {
    const proyectos = await prisma.proyecto.findMany({
      orderBy: { nombre: "asc" },
      include: {
        asignaciones: {
          where: { fechaFin: null, desvincular: false },
          include: { personal: { select: { tipo: true } } },
        },
      },
    });

    const datos = proyectos.map((proyecto) => ({
      proyecto: proyecto.nombre,
      formatto: proyecto.asignaciones.filter((asignacion) => asignacion.personal.tipo === "FORMATTO").length,
      subcontrato: proyecto.asignaciones.filter((asignacion) => asignacion.personal.tipo === "SUBCONTRATO").length,
      costo: proyecto.asignaciones.reduce((sum, asignacion) => sum + asignacion.costoMensual, 0),
    })).filter((row) => row.formatto + row.subcontrato > 0);

    return { datos, error: null as string | null };
  } catch (error) {
    return { datos: [], error: error instanceof Error ? error.message : "No fue posible conectar con Prisma." };
  }
}

export default async function TimelinePage() {
  const { datos, error } = await getTimeline();
  return (
    <>
      <PageHeader
        eyebrow="Planificacion"
        title="Timeline de Dotacion"
        subtitle="Visualizacion React de asignaciones activas por proyecto"
      />
      {error && (
        <div className="mb-4 bg-white border border-border p-4 text-sm text-formatto-umber">
          {error}
        </div>
      )}
      <TimelineRecharts datos={datos} />
    </>
  );
}
