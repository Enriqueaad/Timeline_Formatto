"use client";

import type { DiaSemana } from "@prisma/client";
import type { ParadaPlan } from "./types";
import { ParadaCard } from "./ParadaCard";

type DiaColumnaProps = {
  dia: DiaSemana;
  paradas: ParadaPlan[];
  onSubir: (idx: number) => void;
  onBajar: (idx: number) => void;
  onEliminar: (idx: number) => void;
};

export function DiaColumna({ dia, paradas, onSubir, onBajar, onEliminar }: DiaColumnaProps) {
  return (
    <section className="bg-white border border-border rounded-none min-h-[300px] p-3">
      <h3 className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-4">{dia}</h3>
      <div className="space-y-3">
        {paradas.length === 0 ? (
          <div className="border border-dashed border-border p-4 text-center text-muted-foreground text-sm">- sin paradas</div>
        ) : paradas.map((parada, index) => (
          <ParadaCard
            key={`${parada.proyectoId}-${parada.diaVisita}-${index}`}
            parada={parada}
            onSubir={() => onSubir(index)}
            onBajar={() => onBajar(index)}
            onEliminar={() => onEliminar(index)}
          />
        ))}
      </div>
    </section>
  );
}
