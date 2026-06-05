import { PageHeader } from "@/components/layout/PageHeader";
import { PlanificadorSemanal } from "@/components/supervisores/PlanificadorSemanal";
import type { ParadaPlan } from "@/components/supervisores/types";
import { prisma } from "@/lib/prisma";
import { toLunes } from "@/lib/rutas/date";

export const dynamic = "force-dynamic";

type SearchValue = string | string[] | undefined;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupervisorRutaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semana?: SearchValue }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const semana = toLunes(first(search.semana) ?? new Date());

  try {
    const [supervisor, proyectos, ruta] = await Promise.all([
      prisma.supervisor.findUnique({ where: { id } }),
      prisma.proyecto.findMany({ where: { estado: "ACTIVO" }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
      prisma.rutaVisita.findFirst({
        where: { supervisorId: id, semana: new Date(`${semana}T00:00:00`) },
        include: { paradas: { include: { proyecto: { select: { nombre: true } } }, orderBy: [{ diaVisita: "asc" }, { orden: "asc" }] } },
      }),
    ]);

    if (!supervisor) {
      return (
        <>
          <PageHeader eyebrow="Supervisores" title="Planificador semanal" />
          <div className="bg-white border border-border p-6 text-muted-foreground">Supervisor no encontrado.</div>
        </>
      );
    }

    const rutaActual: ParadaPlan[] = (ruta?.paradas ?? []).map((parada) => ({
      id: parada.id,
      proyectoId: parada.proyectoId,
      proyectoNombre: parada.proyecto.nombre,
      diaVisita: parada.diaVisita,
      orden: parada.orden,
      horaEstimada: parada.horaEstimada,
      observacion: parada.observacion,
    }));

    return (
      <>
        <PageHeader eyebrow={supervisor.nombre} title="Planificador semanal" />
        <PlanificadorSemanal
          supervisorId={supervisor.id}
          supervisorNombre={supervisor.nombre}
          semana={semana}
          rutaActual={rutaActual}
          proyectos={proyectos}
        />
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Supervisores" title="Planificador semanal" />
        <div className="bg-white border border-border p-6 text-muted-foreground">
          {error instanceof Error ? error.message : "No fue posible cargar planificador."}
        </div>
      </>
    );
  }
}
