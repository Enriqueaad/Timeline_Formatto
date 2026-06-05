"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Select, Textarea, Input } from "@/components/ui/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { crearEvaluacion } from "@/lib/actions/evaluacion";

type ProyectoOption = { id: string; nombre: string };

type EvaluarModalProps = {
  personalId: string;
  nombre: string;
  proyectoId?: string | null;
  proyectos: ProyectoOption[];
  onClose: () => void;
};

export function EvaluarModal({ personalId, nombre, proyectoId, proyectos, onClose }: EvaluarModalProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [nota, setNota] = useState(3);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [selectedProyecto, setSelectedProyecto] = useState(proyectoId ?? proyectos[0]?.id ?? "");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!selectedProyecto) {
      setError("Selecciona un proyecto.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await crearEvaluacion({
        personalId,
        proyectoId: selectedProyecto,
        nota,
        periodo,
        observacion,
        evaluadoPor: session?.user?.email ?? "sistema",
      });
      if (!result.ok) setError(result.error ?? "No fue posible evaluar.");
      if (result.ok) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Evaluar</DialogTitle>
          <p className="text-formatto-umber">{nombre}</p>
        </DialogHeader>
        <div className="space-y-4">
          <FieldWrap label="Nota">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setNota(value)}
                  className={`w-10 h-10 text-sm font-bold border border-border rounded-sm ${
                    nota === value ? "bg-formatto-grafito text-white" : "bg-white text-formatto-grafito hover:bg-muted/40"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </FieldWrap>
          <FieldWrap label="Periodo">
            <Input value={periodo} onChange={(event) => setPeriodo(event.target.value)} placeholder="2026-05" />
          </FieldWrap>
          <FieldWrap label="Proyecto">
            <Select value={selectedProyecto} onChange={(event) => setSelectedProyecto(event.target.value)}>
              {proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}
            </Select>
          </FieldWrap>
          <FieldWrap label="Observacion">
            <Textarea value={observacion} onChange={(event) => setObservacion(event.target.value)} />
          </FieldWrap>
        </div>
        {error && <p className="text-primary text-sm">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="primary" loading={isPending} onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
