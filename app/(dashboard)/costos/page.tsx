import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

type GrupoObra = {
  proyectoId: string;
  obra: string;
  personas: number;
  costo: number;
};

async function getData() {
  try {
    const asignaciones = await prisma.asignacionPersonal.findMany({
      where: {
        fechaFin: null,
        desvincular: false,
        personal: { estado: { not: "DESVINCULADO" } },
      },
      include: {
        personal: { select: { tipo: true } },
        proyecto: { select: { id: true, nombre: true } },
      },
      orderBy: { proyecto: { nombre: "asc" } },
    });
    return { asignaciones, error: null as string | null };
  } catch (error) {
    return {
      asignaciones: [] as Awaited<ReturnType<typeof prisma.asignacionPersonal.findMany<{
        include: { personal: { select: { tipo: true } }; proyecto: { select: { id: true; nombre: true } } };
      }>>>,
      error: error instanceof Error ? error.message : "No fue posible conectar con Prisma.",
    };
  }
}

export default async function CostosPage() {
  const { asignaciones, error } = await getData();

  // ── Agrupar por proyecto ──────────────────────────────────────────────────
  const grupoMap = new Map<string, GrupoObra>();

  for (const a of asignaciones) {
    const key = a.proyectoId;
    const current = grupoMap.get(key) ?? {
      proyectoId: key,
      obra: a.proyecto.nombre,
      personas: 0,
      costo: 0,
    };
    current.personas += 1;
    current.costo += a.costoMensual;
    grupoMap.set(key, current);
  }

  const grupos = Array.from(grupoMap.values()).sort((a, b) => b.costo - a.costo);

  // ── Totales ───────────────────────────────────────────────────────────────
  const totalCosto = grupos.reduce((sum, g) => sum + g.costo, 0);
  const totalPersonas = grupos.reduce((sum, g) => sum + g.personas, 0);
  const formatto = asignaciones.filter((a) => a.personal.tipo === "FORMATTO").length;
  const subcontratos = asignaciones.filter((a) => a.personal.tipo === "SUBCONTRATO").length;
  const promedio = totalPersonas > 0 ? Math.round(totalCosto / totalPersonas) : 0;

  return (
    <>
      <PageHeader eyebrow="Análisis" title="Costos de Dotación" />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard eyebrow="Costo total mes" value={formatCLP(totalCosto)} />
        <StatCard eyebrow="Personal Formatto" value={formatto} />
        <StatCard eyebrow="Subcontratos" value={subcontratos} />
        <StatCard eyebrow="Promedio por persona" value={formatCLP(promedio)} />
      </div>

      {error && (
        <div className="mb-4 bg-white border border-border p-4 text-sm text-formatto-umber">
          No fue posible cargar los datos: {error}
        </div>
      )}

      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Obra / Proyecto</TableHead>
              <TableHead className="text-right">N° personas</TableHead>
              <TableHead className="text-right">Costo mensual</TableHead>
              <TableHead className="text-right">% del total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-6 text-center text-formatto-bark">
                  Sin asignaciones activas con costo registrado.
                </TableCell>
              </TableRow>
            ) : (
              grupos.map((grupo) => {
                const porcentaje = totalCosto > 0 ? (grupo.costo / totalCosto) * 100 : 0;
                return (
                  <TableRow key={grupo.proyectoId}>
                    <TableCell className="font-semibold text-formatto-grafito">
                      {grupo.obra}
                    </TableCell>
                    <TableCell className="text-right">{grupo.personas}</TableCell>
                    <TableCell className="text-right">{formatCLP(grupo.costo)}</TableCell>
                    <TableCell className="text-right">{porcentaje.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="font-semibold">Total general</TableCell>
              <TableCell className="text-right font-semibold">{totalPersonas}</TableCell>
              <TableCell className="text-right font-semibold">{formatCLP(totalCosto)}</TableCell>
              <TableCell className="text-right font-semibold">100%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
}
