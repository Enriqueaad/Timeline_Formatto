"use client";

import { useDraggable } from "@dnd-kit/core";
import type { DiaSemana } from "@prisma/client";
import type { ParadaPlan } from "./types";
import { PERIODOS, PERIODO_LABEL, DIA_ABREV } from "./types";

type ParadaCardProps = {
  parada:             ParadaPlan;
  onEliminar:         () => void;
  onPeriodoChange:    (periodo: string | null) => void;
  onToggleCumplida?:  () => void;
};

export function ParadaCard({ parada, onEliminar, onPeriodoChange, onToggleCumplida }: ParadaCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   parada.tempId ?? parada.proyectoId,
    data: { type: "parada", tempId: parada.tempId, diaOrigen: parada.diaVisita },
  });

  const movido =
    parada.originalDia !== undefined && parada.originalDia !== parada.diaVisita;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        "border p-2.5 select-none cursor-grab active:cursor-grabbing transition-opacity",
        isDragging ? "opacity-40" : "",
        parada.completada
          ? "bg-emerald-50 border-emerald-300"
          : movido
            ? "bg-white border-amber-400"
            : "bg-white border-border",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Header: nombre + badge movido + eliminar */}
      <div className="flex items-start justify-between gap-1">
        <p
          className={[
            "font-semibold text-xs leading-tight flex-1 min-w-0 truncate",
            parada.completada ? "text-emerald-800" : "text-formatto-grafito",
          ].join(" ")}
        >
          {parada.proyectoNombre}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {movido && (
            <span
              className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 font-bold leading-none"
              title={`Movido desde ${DIA_ABREV[parada.originalDia as DiaSemana]}`}
            >
              ← {DIA_ABREV[parada.originalDia as DiaSemana]}
            </span>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEliminar(); }}
            className="text-muted-foreground hover:text-primary text-xs w-4 h-4 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>

      {/* Selector de periodo */}
      <div className="flex gap-1 mt-2">
        {PERIODOS.map((p) => {
          const activo = parada.horaEstimada === p;
          return (
            <button
              key={p}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onPeriodoChange(activo ? null : p);
              }}
              className={[
                "flex-1 text-[9px] font-semibold py-0.5 border transition-colors",
                activo
                  ? "bg-formatto-grafito text-white border-formatto-grafito"
                  : "bg-white text-formatto-bark border-border hover:border-formatto-grafito",
              ].join(" ")}
            >
              {PERIODO_LABEL[p]}
            </button>
          );
        })}
      </div>

      {parada.observacion && (
        <p className="text-[10px] text-formatto-umber mt-1.5 leading-tight">
          {parada.observacion}
        </p>
      )}

      {/* Cumplimiento — solo en paradas ya guardadas (con id) */}
      {parada.id && onToggleCumplida && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleCumplida(); }}
          className={[
            "mt-2 w-full text-[10px] font-semibold py-1 border transition-colors flex items-center justify-center gap-1",
            parada.completada
              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
          ].join(" ")}
        >
          {parada.completada ? "✓ Visita realizada" : "Marcar realizada"}
        </button>
      )}
    </div>
  );
}
