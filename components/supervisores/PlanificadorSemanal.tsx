"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { DiaSemana } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { addDays, formatSemana } from "@/lib/rutas/date";
import { copiarSemanaAnterior, guardarRuta } from "@/lib/actions/ruta";
import { DiaColumna } from "./DiaColumna";
import { ProyectoPaleta } from "./ProyectoPaleta";
import { ExportarRutaBtn } from "./ExportarRutaBtn";
import { DIAS_PLANIFICACION, type ParadaPlan, type ProyectoOption } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _counter = 0;
function nuevoTempId() {
  _counter += 1;
  return `tmp-${_counter}`;
}

function normalizarOrden(paradas: ParadaPlan[]): ParadaPlan[] {
  return DIAS_PLANIFICACION.flatMap((dia) =>
    paradas
      .filter((p) => p.diaVisita === dia)
      .sort((a, b) => a.orden - b.orden)
      .map((p, i) => ({ ...p, orden: i }))
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  supervisorId:    string;
  supervisorNombre: string;
  semana:          string;
  rutaActual:      ParadaPlan[];
  proyectos:       ProyectoOption[];
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function PlanificadorSemanal({
  supervisorId,
  supervisorNombre,
  semana,
  rutaActual,
  proyectos,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Inicializar paradas con tempId y originalDia
  const [paradas, setParadas] = useState<ParadaPlan[]>(() =>
    normalizarOrden(
      rutaActual.map((p) => ({
        ...p,
        tempId:      p.id ?? nuevoTempId(),
        originalDia: p.diaVisita,
      }))
    )
  );

  // Estado para DragOverlay
  const [activeItem, setActiveItem] = useState<
    | { type: "proyecto"; proyectoId: string; proyectoNombre: string }
    | { type: "parada"; parada: ParadaPlan }
    | null
  >(null);

  // ── Navegación de semana ──────────────────────────────────────────────────

  function navegar(days: number) {
    router.push(`/supervisores/${supervisorId}/ruta?semana=${addDays(semana, days)}`);
  }

  // ── Operaciones sobre paradas ─────────────────────────────────────────────

  function updateDia(dia: DiaSemana, updater: (items: ParadaPlan[]) => ParadaPlan[]) {
    setParadas((curr) => {
      const otros = curr.filter((p) => p.diaVisita !== dia);
      const delDia = curr.filter((p) => p.diaVisita === dia).sort((a, b) => a.orden - b.orden);
      return normalizarOrden([...otros, ...updater(delDia)]);
    });
  }

  function subir(dia: DiaSemana, idx: number) {
    updateDia(dia, (items) => {
      if (idx <= 0) return items;
      const next = [...items];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function bajar(dia: DiaSemana, idx: number) {
    updateDia(dia, (items) => {
      if (idx >= items.length - 1) return items;
      const next = [...items];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function eliminar(dia: DiaSemana, idx: number) {
    updateDia(dia, (items) => items.filter((_, i) => i !== idx));
  }

  function actualizarHora(dia: DiaSemana, idx: number, hora: string) {
    updateDia(dia, (items) =>
      items.map((p, i) =>
        i === idx ? { ...p, horaEstimada: hora || null } : p
      )
    );
  }

  // ── Guardar / copiar ──────────────────────────────────────────────────────

  function guardar() {
    setMessage(null);
    startTransition(async () => {
      const result = await guardarRuta({
        supervisorId,
        semana,
        paradas: normalizarOrden(paradas).map((p) => ({
          proyectoId:    p.proyectoId,
          diaVisita:     p.diaVisita,
          orden:         p.orden,
          horaEstimada:  p.horaEstimada ?? undefined,
          observacion:   p.observacion ?? undefined,
        })),
      });
      if (result.ok) {
        // Actualizar originalDia para reflejar el nuevo estado guardado
        setParadas((curr) =>
          curr.map((p) => ({ ...p, originalDia: p.diaVisita }))
        );
        setMessage("Ruta guardada.");
        router.refresh();
      } else {
        setMessage(result.error ?? "No fue posible guardar.");
      }
    });
  }

  function copiar() {
    setMessage(null);
    startTransition(async () => {
      const result = await copiarSemanaAnterior({ supervisorId, semanaActual: semana });
      setMessage(result.ok ? "Semana anterior copiada." : result.error ?? "No fue posible copiar.");
      if (result.ok) router.refresh();
    });
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (!data) return;

    if (data.type === "proyecto") {
      setActiveItem({ type: "proyecto", proyectoId: data.proyectoId, proyectoNombre: data.proyectoNombre });
    } else if (data.type === "parada") {
      const parada = paradas.find((p) => p.tempId === data.tempId);
      if (parada) setActiveItem({ type: "parada", parada });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const targetDia = over.id as DiaSemana;
    const data = active.data.current;
    if (!data) return;

    if (data.type === "proyecto") {
      // Agregar nueva parada desde paleta
      const tempId = nuevoTempId();
      setParadas((curr) =>
        normalizarOrden([
          ...curr,
          {
            tempId,
            proyectoId:    data.proyectoId,
            proyectoNombre: data.proyectoNombre,
            diaVisita:     targetDia,
            orden:         curr.filter((p) => p.diaVisita === targetDia).length,
            horaEstimada:  null,
            observacion:   null,
            // Sin originalDia → es nueva, no muestra indicador
          },
        ])
      );
    } else if (data.type === "parada") {
      // Mover parada existente entre días
      const tempId  = data.tempId as string;
      const diaOrigen = data.diaOrigen as DiaSemana;
      if (diaOrigen === targetDia) return;

      setParadas((curr) =>
        normalizarOrden(
          curr.map((p) =>
            p.tempId === tempId ? { ...p, diaVisita: targetDia } : p
          )
        )
      );
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const hayMovidos = paradas.some(
    (p) => p.originalDia !== undefined && p.originalDia !== p.diaVisita
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`space-y-4 ${isPending ? "opacity-70" : ""}`}>

        {/* ── Barra superior ──────────────────────────────────────────────── */}
        <div className="bg-white border border-border p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Semana</p>
            <p className="text-sm font-semibold text-formatto-grafito">{formatSemana(semana)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navegar(-7)}
              className="text-sm font-semibold text-formatto-bark hover:text-formatto-grafito"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => navegar(7)}
              className="text-sm font-semibold text-formatto-bark hover:text-formatto-grafito"
            >
              Siguiente →
            </button>
            <Button type="button" variant="secondary" loading={isPending} onClick={copiar}>
              Copiar semana anterior
            </Button>
            <Button type="button" variant="primary" loading={isPending} onClick={guardar}>
              Guardar ruta
            </Button>
            <ExportarRutaBtn supervisor={supervisorNombre} semana={semana} paradas={paradas} />
          </div>
        </div>

        {/* ── Mensajes ────────────────────────────────────────────────────── */}
        {message && (
          <div className="bg-white border border-border p-3 text-sm text-muted-foreground">
            {message}
          </div>
        )}

        {/* ── Indicador de cambios sin guardar ────────────────────────────── */}
        {hayMovidos && (
          <div className="flex items-center gap-2 text-2xs text-amber-700 bg-amber-50 border border-amber-300 px-3 py-2">
            <span className="font-bold">⚠</span>
            <span>Hay paradas movidas sin guardar — los badges <strong>← DÍA</strong> indican el día original.</span>
          </div>
        )}

        {/* ── Grilla: paleta + 5 días ──────────────────────────────────────── */}
        <div className="grid grid-cols-[180px_repeat(5,minmax(0,1fr))] gap-3">

          {/* Paleta de proyectos */}
          <ProyectoPaleta proyectos={proyectos} paradas={paradas} />

          {/* Columnas de días */}
          {DIAS_PLANIFICACION.map((dia) => {
            const delDia = paradas
              .filter((p) => p.diaVisita === dia)
              .sort((a, b) => a.orden - b.orden);
            return (
              <DiaColumna
                key={dia}
                dia={dia}
                paradas={delDia}
                onSubir={(idx) => subir(dia, idx)}
                onBajar={(idx) => bajar(dia, idx)}
                onEliminar={(idx) => eliminar(dia, idx)}
                onHoraChange={(idx, hora) => actualizarHora(dia, idx, hora)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Ghost mientras se arrastra ───────────────────────────────────── */}
      <DragOverlay>
        {activeItem?.type === "proyecto" && (
          <div className="bg-white border border-primary px-2 py-2 text-xs font-semibold text-formatto-grafito shadow-lg cursor-grabbing">
            {activeItem.proyectoNombre.length > 22
              ? activeItem.proyectoNombre.slice(0, 21) + "…"
              : activeItem.proyectoNombre}
          </div>
        )}
        {activeItem?.type === "parada" && (
          <div className="bg-white border border-primary px-2.5 py-2 text-xs font-semibold text-formatto-grafito shadow-lg cursor-grabbing rotate-1">
            {activeItem.parada.proyectoNombre}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
