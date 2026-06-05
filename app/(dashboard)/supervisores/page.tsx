import { PageHeader } from "@/components/layout/PageHeader";
import { SupervisoresTable } from "@/components/supervisores/SupervisoresTable";
import { prisma } from "@/lib/prisma";
import { toLunes } from "@/lib/rutas/date";

export const dynamic = "force-dynamic";

async function getSupervisores() {
  try {
    const semana = toLunes(new Date());
    const supervisors = await prisma.supervisor.findMany({
      orderBy: { nombre: "asc" },
      include: {
        rutas: {
          where: { semana: new Date(`${semana}T00:00:00`) },
          include: { paradas: true },
        },
      },
    });
    return {
      rows: supervisors.map((supervisor) => ({
        id: supervisor.id,
        nombre: supervisor.nombre,
        rut: supervisor.rut,
        email: supervisor.email,
        telefono: supervisor.telefono,
        activo: supervisor.activo,
        paradasSemana: supervisor.rutas.reduce((sum, ruta) => sum + ruta.paradas.length, 0),
      })),
      error: null as string | null,
    };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : "No fue posible conectar con Prisma.",
    };
  }
}

export default async function SupervisoresPage() {
  const { rows, error } = await getSupervisores();
  return (
    <>
      <PageHeader eyebrow="Personal" title="Supervisores" />
      {error && <div className="mb-4 bg-white border border-border p-4 text-sm text-formatto-umber">{error}</div>}
      <SupervisoresTable rows={rows} />
    </>
  );
}
