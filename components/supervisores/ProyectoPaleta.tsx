"use client";

import { useDraggable } from "@dnd-kit/core";
import type { ProyectoOption, ParadaPlan } from "./types";

type Props = {
  proyectos: ProyectoOption[];
  paradas:   ParadaPlan[];
};

function ProyectoChip({ proyecto, count }: { proyecto: ProyectoOption; count: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   `paleta::${proyecto.id}`,
    data: { type: "proyecto", proyectoId: proyecto.id, proyectoNombre: proyecto.nombre },
  });

  const nombre =
    proyecto.nombre.length > 22
      ? proyecto.nombre.slice(0, 21) + "…"
      : proyecto.nombre;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={proyecto.nombre}
      className={[
        "px-2 py-2 text-xs border select-none cursor-grab active:cursor-grabbing transition-colors",
        isDragging ? "opacity-40" : "",
        count > 0
          ? "bg-primary/5 border-primary/40"
          : "bg-white border-border hover:border-primary hover:bg-accent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="font-semibold text-formatto-grafito leading-tight">{nombre}</p>
      {count > 0 && (
        <p className="text-[10px] text-primary mt-0.5 font-medium">{count} en ruta</p>
      )}
    </div>
  );
}

export function ProyectoPaleta({ proyectos, paradas }: Props) {
  const countMap = new Map<string, number>();
  for (const p of paradas) {
    countMap.set(p.proyectoId, (countMap.get(p.proyectoId) ?? 0) + 1);
  }

  return (
    <aside className="bg-white border border-border p-3 flex flex-col min-h-[300px]">
      <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-1">
        Proyectos
      </p>
      <p className="text-[10px] text-muted-foreground italic mb-3">
        Arrastra a un día
      </p>
      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
        {proyectos.map((proyecto) => (
          <ProyectoChip
            key={proyecto.id}
            proyecto={proyecto}
            count={countMap.get(proyecto.id) ?? 0}
          />
        ))}
        {proyectos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Sin proyectos activos</p>
        )}
      </div>
    </aside>
  );
}
