import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { formatSemana } from "@/lib/rutas/date";
import { HistorialRutas, type SemanaHist } from "@/components/supervisores/HistorialRutas";

export const dynamic = "force-dynamic";

function dateParam(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function SupervisorHistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supervisor = await prisma.supervisor.findUnique({
      where: { id },
      include: {
        rutas: {
          orderBy: { semana: "desc" },
          include: {
            paradas: {
              include: { proyecto: { select: { nombre: true } } },
              orderBy: [{ diaVisita: "asc" }, { orden: "asc" }],
            },
          },
        },
      },
    });

    if (!supervisor) {
      return (
        <>
          <PageHeader eyebrow="Supervisores" title="Historial de rutas" />
          <div className="bg-white border border-border p-6 text-muted-foreground">Supervisor no encontrado.</div>
        </>
      );
    }

    const semanas: SemanaHist[] = supervisor.rutas.map((ruta) => ({
      rutaId:      ruta.id,
      semanaParam: dateParam(ruta.semana),
      semanaLabel: formatSemana(dateParam(ruta.semana)),
      paradas: ruta.paradas.map((p) => ({
        proyectoNombre: p.proyecto.nombre,
        diaVisita:      p.diaVisita,
        diaOriginal:    p.diaOriginal,
        horaEstimada:   p.horaEstimada,
        completada:     p.completada,
      })),
    }));

    return (
      <>
        <PageHeader
          eyebrow={supervisor.nombre}
          title="Historial de rutas"
          actions={
            <>
              <Button asChild variant="secondary" size="md">
                <Link href="/supervisores">Volver</Link>
              </Button>
              <Button asChild variant="primary" size="md">
                <Link href={`/supervisores/${supervisor.id}/ruta`}>Planificar semana</Link>
              </Button>
            </>
          }
        />

        <HistorialRutas supervisorId={supervisor.id} semanas={semanas} />
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Supervisores" title="Historial de rutas" />
        <div className="bg-white border border-border p-6 text-muted-foreground">
          {error instanceof Error ? error.message : "No fue posible cargar historial."}
        </div>
      </>
    );
  }
}
