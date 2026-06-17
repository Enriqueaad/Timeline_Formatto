"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Select } from "@/components/ui/FormField";
import { asignarSupervisor } from "@/lib/actions/asignacionSupervisor";
import { finEstimadoSugerido } from "@/lib/proyectos/fechas";

export type DefinicionesProyecto = {
  id: string;
  fechaInicio: string | null;
  finEstimado: string | null;
  tasaInstalacion: number | null;
  dotacionProyectada: number | null;
};

type SupervisorOption = { id: string; nombre: string };

type DefinicionesFormProps = {
  proyecto: DefinicionesProyecto;
  unidades: number;
  supervisores: SupervisorOption[];
  supervisorActivoId: string | null;
};

export function DefinicionesForm({ proyecto, unidades, supervisores, supervisorActivoId }: DefinicionesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [fechaInicio, setFechaInicio] = useState(proyecto.fechaInicio ?? "");
  const [finEstimado, setFinEstimado] = useState(proyecto.finEstimado ?? "");
  const [tasa, setTasa] = useState(proyecto.tasaInstalacion?.toString() ?? "");
  const [dotacion, setDotacion] = useState(proyecto.dotacionProyectada?.toString() ?? "");
  const [supervisor, setSupervisor] = useState(supervisorActivoId ?? "");

  const tasaNum = parseFloat(tasa);
  const sugerido = finEstimadoSugerido(fechaInicio || null, unidades, Number.isFinite(tasaNum) ? tasaNum : null);

  function usarSugerido() {
    if (sugerido) setFinEstimado(sugerido);
  }

  function guardar() {
    setMessage(null);
    startTransition(async () => {
      try {
        const dotacionNum = parseInt(dotacion, 10);
        const response = await fetch(`/api/proyectos/${proyecto.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fechaInicio: fechaInicio || null,
            finEstimado: finEstimado || null,
            tasaInstalacion: Number.isFinite(tasaNum) && tasaNum > 0 ? tasaNum : null,
            dotacionProyectada: Number.isFinite(dotacionNum) && dotacionNum > 0 ? dotacionNum : null,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No fue posible guardar.");

        // Supervisor responsable (si cambió y hay selección).
        if (supervisor && supervisor !== (supervisorActivoId ?? "")) {
          const res = await asignarSupervisor({ supervisorId: supervisor, proyectoId: proyecto.id });
          if (!res.ok) throw new Error(res.error ?? "No fue posible asignar el supervisor.");
        }

        setMessage("Definiciones guardadas.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No fue posible guardar.");
      }
    });
  }

  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Definiciones operativas</p>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Fecha de inicio">
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Tasa de instalación (deptos/día)">
          <Input
            type="number"
            min={0}
            step="0.5"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
            placeholder="Ej: 2"
          />
        </FieldWrap>

        <FieldWrap label="Fin estimado">
          <Input type="date" value={finEstimado} onChange={(e) => setFinEstimado(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Dotación proyectada (personas)">
          <Input
            type="number"
            min={0}
            value={dotacion}
            onChange={(e) => setDotacion(e.target.value)}
            placeholder="Ej: 4"
          />
        </FieldWrap>

        <FieldWrap label="Supervisor responsable" className="col-span-2">
          <Select value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
            <option value="">— Sin asignar —</option>
            {supervisores.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
        </FieldWrap>
      </div>

      {sugerido && (
        <div className="flex items-center gap-2 text-2xs text-formatto-bark">
          <span>
            Fin sugerido por la tasa ({unidades} unidades):{" "}
            <span className="font-semibold text-formatto-grafito">{sugerido}</span>
          </span>
          {finEstimado !== sugerido && (
            <button type="button" onClick={usarSugerido} className="underline underline-offset-2 text-formatto-grafito">
              usar sugerido
            </button>
          )}
        </div>
      )}

      {message && <p className="text-sm text-formatto-umber">{message}</p>}

      <div className="flex justify-end">
        <Button type="button" loading={isPending} onClick={guardar}>Guardar definiciones</Button>
      </div>
    </div>
  );
}
