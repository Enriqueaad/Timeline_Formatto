"use client";

import { useState, useTransition } from "react";
import type { TipoPersonal } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Select } from "@/components/ui/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { moverPersonal, crearAsignacion } from "@/lib/actions/asignacion";

type ProyectoOption = { id: string; nombre: string };

type MoverPersonalModalProps = {
  personalId: string;
  nombre: string;
  proyectoOrigenId?: string | null;
  proyectos: ProyectoOption[];
  onClose: () => void;
};

export function MoverPersonalModal({ personalId, nombre, proyectoOrigenId, proyectos, onClose }: MoverPersonalModalProps) {
  const [isPending, startTransition] = useTransition();
  const opciones = proyectos.filter((proyecto) => proyecto.id !== proyectoOrigenId);
  const [proyectoDestinoId, setProyectoDestinoId] = useState(opciones[0]?.id ?? "");
  const [fechaEfectiva, setFechaEfectiva] = useState(new Date().toISOString().slice(0, 10));
  const [costoMensual, setCostoMensual] = useState("");
  const [tipoPersonal, setTipoPersonal] = useState<TipoPersonal>("FORMATTO");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!proyectoDestinoId) {
      setError("Selecciona un proyecto destino.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        personalId,
        proyectoDestinoId,
        fechaEfectiva,
        costoMensual: Number(costoMensual || 0),
        tipoPersonal,
      };
      const result = proyectoOrigenId
        ? await moverPersonal({ ...payload, proyectoOrigenId })
        : await crearAsignacion({
            personalId,
            proyectoId: proyectoDestinoId,
            fechaInicio: fechaEfectiva,
            costoMensual: Number(costoMensual || 0),
            tipoPersonal,
          });
      if (!result.ok) setError(result.error ?? "No fue posible mover.");
      if (result.ok) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover personal</DialogTitle>
          <p className="text-formatto-umber">{nombre}</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Proyecto destino">
            <Select value={proyectoDestinoId} onChange={(event) => setProyectoDestinoId(event.target.value)}>
              {opciones.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}
            </Select>
          </FieldWrap>
          <FieldWrap label="Fecha efectiva">
            <Input type="date" value={fechaEfectiva} onChange={(event) => setFechaEfectiva(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Costo mensual">
            <Input type="number" value={costoMensual} onChange={(event) => setCostoMensual(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Tipo">
            <Select value={tipoPersonal} onChange={(event) => setTipoPersonal(event.target.value as TipoPersonal)}>
              <option value="FORMATTO">FORMATTO</option>
              <option value="SUBCONTRATO">SUBCONTRATO</option>
            </Select>
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
