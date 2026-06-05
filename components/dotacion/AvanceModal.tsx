"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Textarea } from "@/components/ui/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { registrarAvance } from "@/lib/actions/avance";

type AvanceModalProps = {
  proyectoId: string;
  unidadesTotales: number;
  onClose: () => void;
};

export function AvanceModal({ proyectoId, unidadesTotales, onClose }: AvanceModalProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [porcentaje, setPorcentaje] = useState("0");
  const [unidadesCompletadas, setUnidadesCompletadas] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await registrarAvance({
        proyectoId,
        fecha,
        porcentaje: Number(porcentaje),
        unidadesCompletadas: Number(unidadesCompletadas || 0),
        unidadesTotales,
        observacion,
        registradoPor: session?.user?.email ?? "sistema",
      });
      if (!result.ok) setError(result.error ?? "No fue posible registrar avance.");
      if (result.ok) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar avance</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Fecha">
            <Input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Porcentaje">
            <Input type="number" min={0} max={100} value={porcentaje} onChange={(event) => setPorcentaje(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Unidades completadas">
            <Input type="number" value={unidadesCompletadas} onChange={(event) => setUnidadesCompletadas(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Observacion" className="col-span-2">
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
