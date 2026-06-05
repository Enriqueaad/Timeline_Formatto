"use client";

import type { ParadaPlan } from "./types";

type ParadaCardProps = {
  parada: ParadaPlan;
  onSubir: () => void;
  onBajar: () => void;
  onEliminar: () => void;
};

export function ParadaCard({ parada, onSubir, onBajar, onEliminar }: ParadaCardProps) {
  return (
    <div className="bg-white border border-border p-3 rounded-none">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-formatto-grafito">{parada.proyectoNombre}</p>
          <p className="text-2xs text-formatto-bark uppercase tracking-widest">{parada.horaEstimada || "Sin hora"}</p>
        </div>
        <button type="button" onClick={onEliminar} className="text-formatto-rojo text-xs font-bold">x</button>
      </div>
      {parada.observacion && <p className="text-xs text-formatto-umber mt-2">{parada.observacion}</p>}
      <div className="flex justify-end gap-1 mt-3">
        <button type="button" onClick={onSubir} className="w-6 h-6 text-xs text-formatto-bark border border-border">↑</button>
        <button type="button" onClick={onBajar} className="w-6 h-6 text-xs text-formatto-bark border border-border">↓</button>
      </div>
    </div>
  );
}
