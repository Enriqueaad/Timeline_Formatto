"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addDays, formatSemana } from "@/lib/rutas/date";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ParadaChip = {
  id: string;
  proyectoId: string;
  proyectoNombre: string;
  horaEstimada: string | null;
};

export type SupervisorRow = {
  id: string;
  nombre: string;
  LUNES:     ParadaChip[];
  MARTES:    ParadaChip[];
  MIERCOLES: ParadaChip[];
  JUEVES:    ParadaChip[];
  VIERNES:   ParadaChip[];
  SABADO:    ParadaChip[];
};

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"] as const;
type Dia = (typeof DIAS)[number];

const DIA_LABEL: Record<Dia, string> = {
  LUNES:     "Lunes",
  MARTES:    "Martes",
  MIERCOLES: "Miércoles",
  JUEVES:    "Jueves",
  VIERNES:   "Viernes",
  SABADO:    "Sábado",
};

// ─── Chip individual ──────────────────────────────────────────────────────────
// Diseñado para recibir useDraggable() de @dnd-kit en el futuro —
// solo hay que envolver este componente con el hook cuando se active DnD.

function Chip({ parada }: { parada: ParadaChip }) {
  const nombre = parada.proyectoNombre.length > 16
    ? parada.proyectoNombre.slice(0, 15) + "…"
    : parada.proyectoNombre;

  return (
    <div
      title={parada.proyectoNombre}
      className="bg-white border border-border px-2 py-1 text-xs select-none cursor-default hover:border-primary hover:bg-accent transition-colors"
    >
      <p className="font-semibold text-formatto-grafito leading-tight">{nombre}</p>
      {parada.horaEstimada && (
        <p className="text-formatto-bark mt-0.5" style={{ fontSize: "10px" }}>
          {parada.horaEstimada}
        </p>
      )}
    </div>
  );
}

// ─── Celda de día ─────────────────────────────────────────────────────────────
// En el futuro esta celda se convierte en useDroppable() de @dnd-kit.

function CeldaDia({ chips }: { chips: ParadaChip[] }) {
  if (chips.length === 0) {
    return (
      <td className="align-top p-2 border-b border-border min-w-[110px]">
        <div className="h-full min-h-[40px]" />
      </td>
    );
  }

  return (
    <td className="align-top p-2 border-b border-border min-w-[110px]">
      <div className="flex flex-col gap-1">
        {chips.map((chip) => (
          <Chip key={chip.id} parada={chip} />
        ))}
      </div>
    </td>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

type RutasPanelProps = {
  semana: string;
  rows: SupervisorRow[];
};

export function RutasPanel({ semana, rows }: RutasPanelProps) {
  const router = useRouter();

  function navegar(days: number) {
    router.push(`/rutas?semana=${addDays(semana, days)}`);
  }

  function totalSupervisor(row: SupervisorRow) {
    return DIAS.reduce((sum, d) => sum + row[d].length, 0);
  }

  return (
    <div className="space-y-4">
      {/* Selector de semana */}
      <div className="bg-white border border-border p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
            Semana activa
          </p>
          <p className="text-sm font-semibold text-formatto-grafito">
            {formatSemana(semana)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => navegar(-7)}>
            ← Anterior
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => navegar(7)}>
            Siguiente →
          </Button>
        </div>
      </div>

      {/* Tabla chips */}
      <div className="border border-border bg-white overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-border">
              <th className="text-left h-10 px-3 text-2xs font-semibold uppercase tracking-widest text-formatto-bark w-[160px]">
                Supervisor
              </th>
              {DIAS.map((dia) => (
                <th
                  key={dia}
                  className="text-left h-10 px-2 text-2xs font-semibold uppercase tracking-widest text-formatto-bark min-w-[110px]"
                >
                  {DIA_LABEL[dia]}
                </th>
              ))}
              <th className="text-center h-10 px-3 text-2xs font-semibold uppercase tracking-widest text-formatto-bark w-[70px]">
                Total
              </th>
              <th className="text-right h-10 px-3 text-2xs font-semibold uppercase tracking-widest text-formatto-bark w-[110px]">
                Acción
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground border-b border-border">
                  Sin supervisores activos.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const total = totalSupervisor(row);
                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    {/* Supervisor */}
                    <td className="align-top p-3 border-b border-border w-[160px]">
                      <p className="font-semibold text-formatto-grafito leading-tight">
                        {row.nombre}
                      </p>
                      {total === 0 && (
                        <p className="text-2xs text-muted-foreground mt-0.5">Sin ruta</p>
                      )}
                    </td>

                    {/* Un CeldaDia por cada día */}
                    {DIAS.map((dia) => (
                      <CeldaDia key={dia} chips={row[dia]} />
                    ))}

                    {/* Total */}
                    <td className="align-top p-3 border-b border-border text-center w-[70px]">
                      {total > 0 ? (
                        <span className="font-bold text-formatto-grafito">{total}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="align-top p-3 border-b border-border text-right w-[110px]">
                      <Button
                        asChild
                        variant={total > 0 ? "secondary" : "primary"}
                        size="sm"
                      >
                        <Link href={`/supervisores/${row.id}/ruta?semana=${semana}`}>
                          {total > 0 ? "Ver ruta" : "Crear ruta"}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer totales */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border bg-white">
                <td className="px-3 py-2 text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
                  Total visitas
                </td>
                {DIAS.map((dia) => {
                  const count = rows.reduce((sum, r) => sum + r[dia].length, 0);
                  return (
                    <td key={dia} className="px-2 py-2 text-sm font-semibold text-formatto-grafito">
                      {count > 0 ? count : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center text-sm font-bold text-formatto-grafito">
                  {rows.reduce((sum, r) => sum + totalSupervisor(r), 0) || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Nota futura DnD */}
      <p className="text-2xs text-muted-foreground text-right">
        Próximamente: arrastrar proyectos entre supervisores y días
      </p>
    </div>
  );
}
