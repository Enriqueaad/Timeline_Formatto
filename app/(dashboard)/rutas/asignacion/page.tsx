import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { AsignacionBoard, type ProyectoRow } from "@/components/rutas/AsignacionBoard";

export const dynamic = "force-dynamic";

export default async function AsignacionPage() {
  try {
    const [proyectos, supervisores] = await Promise.all([
      prisma.proyecto.findMany({
        where: { estado: "ACTIVO" },
        orderBy: { nombre: "asc" },
        include: {
          asignacionesSupervisor: {
            include: { supervisor: { select: { id: true, nombre: true } } },
            orderBy: { desde: "desc" },
          },
        },
      }),
      prisma.supervisor.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
    ]);

    const rows: ProyectoRow[] = proyectos.map((p) => {
      const activa = p.asignacionesSupervisor.find((a) => a.hasta === null) ?? null;
      const historial = p.asignacionesSupervisor
        .filter((a) => a.hasta !== null)
        .map((a) => ({
          supervisorNombre: a.supervisor.nombre,
          desde:            a.desde.toISOString(),
          hasta:            a.hasta!.toISOString(),
        }));

      return {
        id:     p.id,
        nombre: p.nombre,
        estado: p.estado,
        asignacionActiva: activa
          ? {
              supervisorId:     activa.supervisor.id,
              supervisorNombre: activa.supervisor.nombre,
              desde:            activa.desde.toISOString(),
            }
          : null,
        historial,
      };
    });

    return (
      <>
        <PageHeader
          eyebrow="Planificacion"
          title="Asignación de Supervisores"
        />
        <AsignacionBoard proyectos={rows} supervisores={supervisores} />
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Planificacion" title="Asignación de Supervisores" />
        <div className="bg-white border border-border p-6 text-muted-foreground">
          {error instanceof Error ? error.message : "No fue posible cargar las asignaciones."}
        </div>
      </>
    );
  }
}
