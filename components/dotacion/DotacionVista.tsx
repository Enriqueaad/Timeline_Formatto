"use client";

import { useState } from "react";
import { LayoutList, LayoutGrid } from "lucide-react";
import { DotacionTable, type DotacionRow } from "./DotacionTable";
import { DotacionBoard } from "./DotacionBoard";

type ProyectoOption = { id: string; nombre: string };

type Props = {
  rows: DotacionRow[];
  proyectos: ProyectoOption[];
};

type Vista = "tabla" | "tablero";

export function DotacionVista({ rows, proyectos }: Props) {
  const [vista, setVista] = useState<Vista>("tabla");

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-1 border border-border bg-white w-fit p-1">
        <button
          type="button"
          onClick={() => setVista("tabla")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
            vista === "tabla"
              ? "bg-formatto-grafito text-white"
              : "text-muted-foreground hover:text-formatto-grafito"
          }`}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Vista tabla
        </button>
        <button
          type="button"
          onClick={() => setVista("tablero")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
            vista === "tablero"
              ? "bg-formatto-grafito text-white"
              : "text-muted-foreground hover:text-formatto-grafito"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Vista tablero
        </button>
      </div>

      {/* Contenido */}
      {vista === "tabla" ? (
        <DotacionTable rows={rows} proyectos={proyectos} />
      ) : (
        <DotacionBoard rows={rows} proyectos={proyectos} />
      )}
    </div>
  );
}
