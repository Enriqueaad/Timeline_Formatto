"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/Button";
import { addDays, formatSemana } from "@/lib/rutas/date";
import { moverParada } from "@/lib/actions/ruta";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ParadaChip = {
  id: string;
  proyectoId: string;
  proyectoNombre: string;
  horaEstimada: string | null;
  esFueraDePlan: boolean;          // true si el supervisor que visita ≠ asignado oficial
  completada: boolean;             // visita realizada
  diaOriginal: string | null;      // día del plan original si se movió
};

const DIA_ABREV_CHIP: Record<string, string> = {
  LUNES: "LUN", MARTES: "MAR", MIERCOLES: "MIÉ",
  JUEVES: "JUE", VIERNES: "VIE", SABADO: "SÁB",
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

type ChipProps = {
  parada:      ParadaChip;
  supervisorId: string;
  dia:          Dia;
  overlay?:     boolean;
};

function Chip({ parada, supervisorId, dia, overlay = false }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   parada.id,
    data: { supervisorId, dia },
  });

  const nombre =
    parada.proyectoNombre.length > 16
      ? parada.proyectoNombre.slice(0, 15) + "…"
      : parada.proyectoNombre;

  const movido = parada.diaOriginal !== null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={
        parada.esFueraDePlan
          ? `${parada.proyectoNombre} — Supervisor no asignado a este proyecto`
          : movido
            ? `${parada.proyectoNombre} — Movido desde ${DIA_ABREV_CHIP[parada.diaOriginal as string] ?? parada.diaOriginal}`
            : parada.proyectoNombre
      }
      className={[
        "px-2 py-1 text-xs select-none transition-colors",
        overlay
          ? "shadow-lg rotate-1 cursor-grabbing"
          : "cursor-grab active:cursor-grabbing",
        isDragging && !overlay ? "opacity-40" : "",
        parada.completada
          ? "bg-emerald-50 border border-emerald-300"
          : parada.esFueraDePlan
            ? "bg-amber-50 border border-amber-400 hover:border-amber-500"
            : "bg-white border border-border hover:border-primary hover:bg-accent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          className={[
            "font-semibold leading-tight",
            parada.completada ? "text-emerald-800" : "text-formatto-grafito",
          ].join(" ")}
        >
          {nombre}
        </p>
        <span className="flex items-center gap-0.5 shrink-0">
          {parada.completada && (
            <span className="text-emerald-600 text-[10px] leading-tight" aria-label="Visita realizada">✓</span>
          )}
          {parada.esFueraDePlan && (
            <span className="text-amber-500 text-[10px] leading-tight" aria-label="Fuera de asignación">⚠</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {parada.horaEstimada && (
          <span className="text-formatto-bark" style={{ fontSize: "10px" }}>
            {parada.horaEstimada}
          </span>
        )}
        {movido && (
          <span
            className="bg-amber-100 text-amber-700 px-1 font-bold leading-none"
            style={{ fontSize: "9px" }}
          >
            ← {DIA_ABREV_CHIP[parada.diaOriginal as string] ?? parada.diaOriginal}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Celda de día (droppable) ─────────────────────────────────────────────────

function CeldaDia({
  chips,
  supervisorId,
  dia,
}: {
  chips:        ParadaChip[];
  supervisorId: string;
  dia:          Dia;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id:   `${supervisorId}::${dia}`,
    data: { supervisorId, dia },
  });

  return (
    <td
      ref={setNodeRef}
      className={[
        "align-top p-2 border-b border-border min-w-[110px] transition-colors",
        isOver ? "bg-primary/5 border-l-2 border-l-primary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-1 min-h-[40px]">
        {chips.map((chip) => (
          <Chip key={chip.id} parada={chip} supervisorId={supervisorId} dia={dia} />
        ))}
      </div>
    </td>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

type RutasPanelProps = {
  semana:      string;
  rows:        SupervisorRow[];
};

export function RutasPanel({ semana, rows: initialRows }: RutasPanelProps) {
  const router = useRouter();
  const [rows, setRows] = useState<SupervisorRow[]>(initialRows);
  const [activeChip, setActiveChip] = useState<
    (ParadaChip & { supervisorId: string; dia: Dia }) | null
  >(null);
  const [isPending, startTransition] = useTransition();

  // Sincronizar cuando el servidor entrega nuevos datos (cambio de semana)
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  function navegar(days: number) {
    router.push(`/rutas?semana=${addDays(semana, days)}`);
  }

  function totalSupervisor(row: SupervisorRow) {
    return DIAS.reduce((sum, d) => sum + row[d].length, 0);
  }

  function handleDragStart(event: DragStartEvent) {
    const fromSupervisorId = event.active.data.current?.supervisorId as string;
    const fromDia          = event.active.data.current?.dia as Dia;
    const chip = rows
      .find((r) => r.id === fromSupervisorId)
      ?.[fromDia]
      .find((c) => c.id === event.active.id);
    if (chip) setActiveChip({ ...chip, supervisorId: fromSupervisorId, dia: fromDia });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveChip(null);
    const { active, over } = event;
    if (!over) return;

    const paradaId         = active.id as string;
    const fromSupervisorId = active.data.current?.supervisorId as string;
    const fromDia          = active.data.current?.dia as Dia;
    const toSupervisorId   = over.data.current?.supervisorId as string;
    const toDia            = over.data.current?.dia as Dia;

    if (fromSupervisorId === toSupervisorId && fromDia === toDia) return;

    // ── Actualización optimista ───────────────────────────────────────────────
    setRows((prev) => {
      const chipToMove = prev
        .find((r) => r.id === fromSupervisorId)
        ?.[fromDia]
        .find((c) => c.id === paradaId);
      if (!chipToMove) return prev;

      return prev.map((row) => {
        let updated = { ...row };
        if (row.id === fromSupervisorId) {
          updated = { ...updated, [fromDia]: updated[fromDia].filter((c) => c.id !== paradaId) };
        }
        if (row.id === toSupervisorId) {
          updated = { ...updated, [toDia]: [...updated[toDia], chipToMove] };
        }
        return updated;
      });
    });

    // ── Server action ─────────────────────────────────────────────────────────
    startTransition(async () => {
      const result = await moverParada({
        paradaId,
        targetSupervisorId: toSupervisorId,
        targetDia:          toDia,
        semana,
      });
      if (!result.ok) {
        // Revertir si falla
        setRows(initialRows);
        router.refresh();
      }
    });
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`space-y-4 transition-opacity ${isPending ? "opacity-70" : ""}`}>

        {/* ── Selector de semana ──────────────────────────────────────────── */}
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

        {/* ── Leyenda ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border border-border bg-white" />
            Visita planificada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border border-amber-400 bg-amber-50" />
            <span className="text-amber-500">⚠</span>
            Supervisor no asignado al proyecto
          </span>
          <span className="flex items-center gap-1.5 ml-auto italic">
            Arrastra chips para mover visitas entre días o supervisores
          </span>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className="border border-border bg-white overflow-x-auto">
          <table className="w-full border-collapse text-sm">
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
                  <td
                    colSpan={9}
                    className="p-8 text-center text-muted-foreground border-b border-border"
                  >
                    Sin supervisores activos.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const total = totalSupervisor(row);
                  return (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      {/* Nombre supervisor */}
                      <td className="align-top p-3 border-b border-border w-[160px]">
                        <p className="font-semibold text-formatto-grafito leading-tight">
                          {row.nombre}
                        </p>
                        {total === 0 && (
                          <p className="text-2xs text-muted-foreground mt-0.5">Sin ruta</p>
                        )}
                      </td>

                      {/* Celdas por día */}
                      {DIAS.map((dia) => (
                        <CeldaDia
                          key={dia}
                          chips={row[dia]}
                          supervisorId={row.id}
                          dia={dia}
                        />
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
      </div>

      {/* Ghost chip mientras se arrastra */}
      <DragOverlay>
        {activeChip ? (
          <Chip
            parada={activeChip}
            supervisorId={activeChip.supervisorId}
            dia={activeChip.dia}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
