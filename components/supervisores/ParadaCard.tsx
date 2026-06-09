"use client";

import { useDraggable } from "@dnd-kit/core";

// Auto-formatea a HH:MM al escribir
// "900" → "9:00" | "1030" → "10:30" | "230" → "23:0"
function formatHora(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  const first = parseInt(digits[0], 10);
  if (first >= 3) {
    // Hora de 1 dígito (3-9): colon tras el primer dígito
    return digits.length === 1 ? digits : `${digits[0]}:${digits.slice(1, 3)}`;
  }
  // Hora de 2 dígitos (0-2X): colon tras los dos primeros
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}
import type { DiaSemana } from "@prisma/client";
import type { ParadaPlan } from "./types";
import { DIA_ABREV } from "./types";

type ParadaCardProps = {
  parada:        ParadaPlan;
  onSubir:       () => void;
  onBajar:       () => void;
  onEliminar:    () => void;
  onHoraChange:  (hora: string) => void;
};

export function ParadaCard({ parada, onSubir, onBajar, onEliminar, onHoraChange }: ParadaCardProps) {
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
        "bg-white border p-2.5 select-none cursor-grab active:cursor-grabbing transition-opacity",
        isDragging ? "opacity-40" : "",
        movido ? "border-amber-400" : "border-border",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Header: nombre + badge movido + eliminar */}
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold text-formatto-grafito text-xs leading-tight flex-1 min-w-0 truncate">
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

      {/* Hora editable — stopPropagation para no activar drag al escribir */}
      <input
        type="text"
        placeholder="HH:MM"
        value={parada.horaEstimada ?? ""}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onHoraChange(formatHora(e.target.value))}
        className="mt-1.5 w-full text-[10px] text-formatto-bark border border-border px-1.5 py-0.5 bg-white focus:outline-none focus:border-primary"
        maxLength={5}
      />

      {parada.observacion && (
        <p className="text-[10px] text-formatto-umber mt-1 leading-tight">{parada.observacion}</p>
      )}

      {/* Orden dentro del día */}
      <div className="flex justify-end gap-1 mt-2">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onSubir(); }}
          className="w-5 h-5 text-[10px] text-formatto-bark border border-border hover:border-primary flex items-center justify-center"
        >↑</button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onBajar(); }}
          className="w-5 h-5 text-[10px] text-formatto-bark border border-border hover:border-primary flex items-center justify-center"
        >↓</button>
      </div>
    </div>
  );
}
