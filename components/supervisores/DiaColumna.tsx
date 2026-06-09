"use client";

import { useDroppable } from "@dnd-kit/core";
import type { DiaSemana } from "@prisma/client";
import type { ParadaPlan } from "./types";
import { DIA_LABEL } from "./types";
import { ParadaCard } from "./ParadaCard";

type DiaColumnaProps = {
  dia:           DiaSemana;
  paradas:       ParadaPlan[];
  onSubir:       (idx: number) => void;
  onBajar:       (idx: number) => void;
  onEliminar:    (idx: number) => void;
  onHoraChange:  (idx: number, hora: string) => void;
};

export function DiaColumna({ dia, paradas, onSubir, onBajar, onEliminar, onHoraChange }: DiaColumnaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dia });

  return (
    <section
      ref={setNodeRef}
      className={[
        "border rounded-none min-h-[300px] p-3 flex flex-col transition-colors",
        isOver ? "bg-primary/5 border-primary" : "bg-white border-border",
      ].join(" ")}
    >
      {/* Header día */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
          {DIA_LABEL[dia]}
        </h3>
        {paradas.length > 0 && (
          <span className="text-2xs text-muted-foreground">{paradas.length}</span>
        )}
      </div>

      {/* Zona de drop */}
      <div className="flex flex-col gap-2 flex-1">
        {paradas.length === 0 ? (
          <div
            className={[
              "border border-dashed p-4 text-center text-xs flex-1 flex items-center justify-center transition-colors",
              isOver
                ? "border-primary text-primary bg-primary/5"
                : "border-border text-muted-foreground",
            ].join(" ")}
          >
            {isOver ? "Soltar aquí" : "—"}
          </div>
        ) : (
          paradas.map((parada, index) => (
            <ParadaCard
              key={parada.tempId}
              parada={parada}
              onSubir={() => onSubir(index)}
              onBajar={() => onBajar(index)}
              onEliminar={() => onEliminar(index)}
              onHoraChange={(hora) => onHoraChange(index, hora)}
            />
          ))
        )}
      </div>
    </section>
  );
}
