"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DiaSemana } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Select, Textarea } from "@/components/ui/FormField";
import { addDays, formatSemana } from "@/lib/rutas/date";
import { copiarSemanaAnterior, guardarRuta } from "@/lib/actions/ruta";
import { DiaColumna } from "./DiaColumna";
import { ExportarRutaBtn } from "./ExportarRutaBtn";
import { DIAS_PLANIFICACION, type ParadaPlan, type ProyectoOption } from "./types";

type PlanificadorSemanalProps = {
  supervisorId: string;
  supervisorNombre: string;
  semana: string;
  rutaActual: ParadaPlan[];
  proyectos: ProyectoOption[];
};

function normalizarOrden(paradas: ParadaPlan[]) {
  return DIAS_PLANIFICACION.flatMap((dia) =>
    paradas
      .filter((parada) => parada.diaVisita === dia)
      .sort((a, b) => a.orden - b.orden)
      .map((parada, index) => ({ ...parada, orden: index }))
  );
}

export function PlanificadorSemanal({ supervisorId, supervisorNombre, semana, rutaActual, proyectos }: PlanificadorSemanalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paradas, setParadas] = useState<ParadaPlan[]>(normalizarOrden(rutaActual));
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? "");
  const [diaVisita, setDiaVisita] = useState<DiaSemana>("LUNES");
  const [horaEstimada, setHoraEstimada] = useState("");
  const [observacion, setObservacion] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const proyectoMap = useMemo(() => new Map(proyectos.map((proyecto) => [proyecto.id, proyecto.nombre])), [proyectos]);

  function navegar(days: number) {
    router.push(`/supervisores/${supervisorId}/ruta?semana=${addDays(semana, days)}`);
  }

  function agregarParada() {
    const proyectoNombre = proyectoMap.get(proyectoId);
    if (!proyectoId || !proyectoNombre) return;
    const orden = paradas.filter((parada) => parada.diaVisita === diaVisita).length;
    setParadas((current) => normalizarOrden([
      ...current,
      { proyectoId, proyectoNombre, diaVisita, orden, horaEstimada: horaEstimada || null, observacion: observacion || null },
    ]));
    setHoraEstimada("");
    setObservacion("");
  }

  function updateDia(dia: DiaSemana, updater: (items: ParadaPlan[]) => ParadaPlan[]) {
    setParadas((current) => {
      const other = current.filter((parada) => parada.diaVisita !== dia);
      const dayItems = current.filter((parada) => parada.diaVisita === dia).sort((a, b) => a.orden - b.orden);
      return normalizarOrden([...other, ...updater(dayItems)]);
    });
  }

  function subir(dia: DiaSemana, index: number) {
    updateDia(dia, (items) => {
      if (index <= 0) return items;
      const next = [...items];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function bajar(dia: DiaSemana, index: number) {
    updateDia(dia, (items) => {
      if (index >= items.length - 1) return items;
      const next = [...items];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function eliminar(dia: DiaSemana, index: number) {
    updateDia(dia, (items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  function guardar() {
    setMessage(null);
    startTransition(async () => {
      const result = await guardarRuta({
        supervisorId,
        semana,
        paradas: normalizarOrden(paradas).map((parada) => ({
          proyectoId: parada.proyectoId,
          diaVisita: parada.diaVisita,
          orden: parada.orden,
          horaEstimada: parada.horaEstimada ?? undefined,
          observacion: parada.observacion ?? undefined,
        })),
      });
      setMessage(result.ok ? "Ruta guardada." : result.error ?? "No fue posible guardar.");
      if (result.ok) router.refresh();
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

  return (
    <div className="space-y-5">
      <div className="bg-white border border-border p-4 rounded-none flex items-center justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Semana</p>
          <p className="text-sm font-semibold text-formatto-grafito">{formatSemana(semana)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navegar(-7)} className="text-sm font-semibold text-formatto-bark hover:text-formatto-grafito">Anterior</button>
          <button type="button" onClick={() => navegar(7)} className="text-sm font-semibold text-formatto-bark hover:text-formatto-grafito">Siguiente</button>
          <Button type="button" variant="secondary" loading={isPending} onClick={copiar}>Copiar semana anterior</Button>
          <Button type="button" variant="primary" loading={isPending} onClick={guardar}>Guardar ruta</Button>
          <ExportarRutaBtn supervisor={supervisorNombre} semana={semana} paradas={paradas} />
        </div>
      </div>

      {message && <div className="bg-white border border-border p-3 text-sm text-muted-foreground">{message}</div>}

      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_260px] gap-3">
        {DIAS_PLANIFICACION.map((dia) => {
          const delDia = paradas.filter((parada) => parada.diaVisita === dia).sort((a, b) => a.orden - b.orden);
          return (
            <DiaColumna
              key={dia}
              dia={dia}
              paradas={delDia}
              onSubir={(idx) => subir(dia, idx)}
              onBajar={(idx) => bajar(dia, idx)}
              onEliminar={(idx) => eliminar(dia, idx)}
            />
          );
        })}

        <aside className="bg-white border border-border rounded-none p-4 space-y-4">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Agregar parada</p>
          <FieldWrap label="Proyecto">
            <Select value={proyectoId} onChange={(event) => setProyectoId(event.target.value)}>
              {proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}
            </Select>
          </FieldWrap>
          <FieldWrap label="Dia">
            <Select value={diaVisita} onChange={(event) => setDiaVisita(event.target.value as DiaSemana)}>
              {DIAS_PLANIFICACION.map((dia) => <option key={dia} value={dia}>{dia}</option>)}
            </Select>
          </FieldWrap>
          <FieldWrap label="Hora">
            <Input value={horaEstimada} onChange={(event) => setHoraEstimada(event.target.value)} placeholder="09:30" />
          </FieldWrap>
          <FieldWrap label="Observacion">
            <Textarea value={observacion} onChange={(event) => setObservacion(event.target.value)} />
          </FieldWrap>
          <Button type="button" variant="secondary" className="w-full justify-center" onClick={agregarParada} disabled={proyectos.length === 0}>
            Agregar
          </Button>
        </aside>
      </div>
    </div>
  );
}
