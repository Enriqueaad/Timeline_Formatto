import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { toLunes } from "@/lib/rutas/date";
import { RutasPanel, type SupervisorRow } from "@/components/rutas/RutasPanel";

export const dynamic = "force-dynamic";

type SearchValue = string | string[] | undefined;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RutasPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: SearchValue }>;
}) {
  const search = await searchParams;
  const semana = toLunes(first(search.semana) ?? new Date());

  try {
    const supervisores = await prisma.supervisor.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      include: {
        rutas: {
          where: { semana: new Date(`${semana}T00:00:00`) },
          include: {
            paradas: {
              include: { proyecto: { select: { nombre: true } } },
              orderBy: [{ diaVisita: "asc" }, { orden: "asc" }],
            },
          },
        },
      },
    });

    const rows: SupervisorRow[] = supervisores.map((s) => {
      const paradas = s.rutas[0]?.paradas ?? [];
      const chips = (dia: string) =>
        paradas
          .filter((p) => p.diaVisita === dia)
          .map((p) => ({
            id:              p.id,
            proyectoId:      p.proyectoId,
            proyectoNombre:  p.proyecto.nombre,
            horaEstimada:    p.horaEstimada,
          }));

      return {
        id:        s.id,
        nombre:    s.nombre,
        LUNES:     chips("LUNES"),
        MARTES:    chips("MARTES"),
        MIERCOLES: chips("MIERCOLES"),
        JUEVES:    chips("JUEVES"),
        VIERNES:   chips("VIERNES"),
        SABADO:    chips("SABADO"),
      };
    });

    return (
      <>
        <PageHeader eyebrow="Planificacion" title="Rutas de Visita" />
        <RutasPanel semana={semana} rows={rows} />
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Planificacion" title="Rutas de Visita" />
        <div className="bg-white border border-border p-6 text-muted-foreground">
          {error instanceof Error ? error.message : "No fue posible cargar las rutas."}
        </div>
      </>
    );
  }
}
