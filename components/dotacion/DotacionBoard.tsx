"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { moverPersonal, crearAsignacion } from "@/lib/actions/asignacion";
import type { DotacionRow } from "./DotacionTable";

type ProyectoOption = { id: string; nombre: string };

type Props = {
  rows: DotacionRow[];
  proyectos: ProyectoOption[];
};

// ─── Tarjeta individual ───────────────────────────────────────────────────────

function PersonalCard({ row, proyectos }: { row: DotacionRow; proyectos: ProyectoOption[] }) {
  const [isPending, startTransition] = useTransition();

  const opciones = proyectos.filter((p) => p.id !== row.proyectoActual?.id);

  function mover(proyectoDestinoId: string) {
    const hoy = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      if (row.proyectoActual) {
        await moverPersonal({
          personalId:       row.id,
          proyectoOrigenId: row.proyectoActual.id,
          proyectoDestinoId,
          fechaEfectiva:    hoy,
          costoMensual:     row.costoMensual,
          tipoPersonal:     row.tipo,
        });
      } else {
        await crearAsignacion({
          personalId:    row.id,
          proyectoId:    proyectoDestinoId,
          fechaInicio:   hoy,
          tipoPersonal:  row.tipo,
        });
      }
    });
  }

  return (
    <div className={`bg-white border border-border p-3 w-[160px] flex-shrink-0 space-y-2 ${isPending ? "opacity-50" : ""}`}>
      <div>
        <p className="text-sm font-semibold text-formatto-grafito leading-tight">
          {row.nombreCompleto}
        </p>
        <p className="text-2xs text-formatto-bark mt-0.5">{row.cargo}</p>
      </div>

      <Badge
        variant={row.tipo === "FORMATTO" ? "default" : "secondary"}
        className="text-2xs"
      >
        {row.tipo}
      </Badge>

      {/* Quick-move select */}
      <select
        disabled={isPending || opciones.length === 0}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            mover(e.target.value);
            e.target.value = "";
          }
        }}
        className="w-full text-xs border border-border bg-white px-2 py-1 text-formatto-grafito focus:outline-none focus:border-primary disabled:opacity-40 cursor-pointer"
      >
        <option value="" disabled>
          {isPending ? "Moviendo…" : row.proyectoActual ? "Mover ▾" : "Asignar ▾"}
        </option>
        {opciones.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre.length > 20 ? p.nombre.slice(0, 19) + "…" : p.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Grupo por proyecto ───────────────────────────────────────────────────────

function ProyectoSection({
  nombre,
  personas,
  proyectos,
  sinProyecto = false,
}: {
  nombre: string;
  personas: DotacionRow[];
  proyectos: ProyectoOption[];
  sinProyecto?: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Cabecera de sección */}
      <div className="flex items-center gap-3">
        <div className={`h-px flex-1 ${sinProyecto ? "bg-border" : "bg-primary"}`} />
        <span
          className={`text-2xs font-semibold uppercase tracking-widest px-1 ${
            sinProyecto ? "text-muted-foreground" : "text-formatto-grafito"
          }`}
        >
          {nombre}
        </span>
        <span className="text-2xs text-muted-foreground">
          · {personas.length} {personas.length === 1 ? "persona" : "personas"}
        </span>
        <div className={`h-px flex-1 ${sinProyecto ? "bg-border" : "bg-primary"}`} />
      </div>

      {/* Tarjetas */}
      <div className="flex flex-wrap gap-3">
        {personas.map((row) => (
          <PersonalCard key={row.id} row={row} proyectos={proyectos} />
        ))}
      </div>
    </div>
  );
}

// ─── Board principal ──────────────────────────────────────────────────────────

export function DotacionBoard({ rows, proyectos }: Props) {
  // Solo personal activo en el tablero
  const activos = rows.filter(
    (r) => r.estado !== "DESVINCULADO" && r.estado !== "INACTIVO"
  );

  // Agrupar por proyecto
  const grupoMap = new Map<string, { nombre: string; personas: DotacionRow[] }>();

  for (const row of activos) {
    if (row.proyectoActual) {
      const key = row.proyectoActual.id;
      if (!grupoMap.has(key)) {
        grupoMap.set(key, { nombre: row.proyectoActual.nombre, personas: [] });
      }
      grupoMap.get(key)!.personas.push(row);
    }
  }

  const sinProyecto = activos.filter((r) => !r.proyectoActual);

  // Ordenar grupos por nombre
  const grupos = Array.from(grupoMap.entries())
    .map(([, v]) => v)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="space-y-8">
      {grupos.length === 0 && sinProyecto.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Sin personal activo.</p>
      )}

      {grupos.map((grupo) => (
        <ProyectoSection
          key={grupo.nombre}
          nombre={grupo.nombre}
          personas={grupo.personas}
          proyectos={proyectos}
        />
      ))}

      {sinProyecto.length > 0 && (
        <ProyectoSection
          nombre="Sin proyecto"
          personas={sinProyecto}
          proyectos={proyectos}
          sinProyecto
        />
      )}
    </div>
  );
}
