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
import { getSupabaseAnon } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PersonalRow = {
  id: string;
  nombre: string | null;
  cargo: string | null;
  obra_id: string | null;
  obra_nombre: string | null;
  cant: number | null;
  costo: number | null;
};

type ObraCosto = {
  obra: string;
  personas: number;
  costo: number;
};

function cantidad(row: PersonalRow) {
  return row.cant && row.cant > 0 ? row.cant : 1;
}

function esSubcontrato(row: PersonalRow) {
  return `${row.nombre ?? ""} ${row.cargo ?? ""}`.toLowerCase().includes("subcontrato");
}

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

async function getPersonal() {
  const supabase = getSupabaseAnon();
  if (!supabase) {
    return { rows: [] as PersonalRow[], error: "Supabase no esta configurado." };
  }

  const { data, error } = await supabase
    .from("personal")
    .select("id,nombre,cargo,obra_id,obra_nombre,cant,costo")
    .order("obra_nombre", { ascending: true })
    .limit(100);

  if (error) return { rows: [] as PersonalRow[], error: error.message };
  return { rows: (data ?? []) as PersonalRow[], error: null as string | null };
}

function agruparPorObra(rows: PersonalRow[]) {
  const byObra = new Map<string, ObraCosto>();

  for (const row of rows) {
    const obra = row.obra_nombre ?? row.obra_id ?? "Sin obra";
    const current = byObra.get(obra) ?? { obra, personas: 0, costo: 0 };
    current.personas += cantidad(row);
    current.costo += row.costo ?? 0;
    byObra.set(obra, current);
  }

  return Array.from(byObra.values()).sort((a, b) => b.costo - a.costo);
}

export default async function CostosPage() {
  const { rows, error } = await getPersonal();
  const grupos = agruparPorObra(rows);
  const totalCosto = grupos.reduce((sum, row) => sum + row.costo, 0);
  const totalPersonas = grupos.reduce((sum, row) => sum + row.personas, 0);
  const subcontratos = rows.filter(esSubcontrato).reduce((sum, row) => sum + cantidad(row), 0);
  const formatto = totalPersonas - subcontratos;
  const promedio = totalPersonas > 0 ? Math.round(totalCosto / totalPersonas) : 0;

  return (
    <>
      <PageHeader eyebrow="Analisis" title="Costos de Dotacion" />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard eyebrow="Costo total mes" value={formatCLP(totalCosto)} />
        <StatCard eyebrow="Personal Formatto" value={formatto} />
        <StatCard eyebrow="Subcontratos" value={subcontratos} />
        <StatCard eyebrow="Promedio por persona" value={formatCLP(promedio)} />
      </div>

      {error && (
        <div className="mb-4 bg-white border border-border p-4 text-sm text-formatto-umber">
          No fue posible cargar datos desde Supabase: {error}
        </div>
      )}

      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Obra</TableHead>
              <TableHead className="text-right">N personas</TableHead>
              <TableHead className="text-right">Costo mensual</TableHead>
              <TableHead className="text-right">% del total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-6 text-center text-formatto-bark">
                  Sin costos para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              grupos.map((row) => {
                const porcentaje = totalCosto > 0 ? (row.costo / totalCosto) * 100 : 0;
                return (
                  <TableRow key={row.obra}>
                    <TableCell className="font-semibold text-formatto-grafito">{row.obra}</TableCell>
                    <TableCell className="text-right">{row.personas}</TableCell>
                    <TableCell className="text-right">{formatCLP(row.costo)}</TableCell>
                    <TableCell className="text-right">{porcentaje.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell>Total general</TableCell>
              <TableCell className="text-right">{totalPersonas}</TableCell>
              <TableCell className="text-right">{formatCLP(totalCosto)}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
}
