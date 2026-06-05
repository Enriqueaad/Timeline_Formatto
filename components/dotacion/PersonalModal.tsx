"use client";

import { useState, useTransition } from "react";
import type { EstadoPersonal, TipoContrato, TipoPersonal } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Select } from "@/components/ui/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { crearPersonal, editarPersonal } from "@/lib/actions/personal";

export type PersonalModalRow = {
  id: string;
  nombreCompleto: string;
  rut: string;
  cargo: string;
  tipoContrato: TipoContrato;
  tipo: TipoPersonal;
  estado: EstadoPersonal;
};

type PersonalModalProps = {
  personal?: PersonalModalRow;
  onClose: () => void;
};

export function PersonalModal({ personal, onClose }: PersonalModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(personal?.nombreCompleto ?? "");
  const [rut, setRut] = useState(personal?.rut ?? "");
  const [cargo, setCargo] = useState(personal?.cargo ?? "");
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>(personal?.tipoContrato ?? "PLAZO_FIJO");
  const [tipo, setTipo] = useState<TipoPersonal>(personal?.tipo ?? "FORMATTO");

  function submit() {
    if (nombre.trim().length < 3) {
      setError("Nombre requerido.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = personal
        ? await editarPersonal(personal.id, { nombre, rut, cargo, tipoContrato, tipo })
        : await crearPersonal({ nombre, rut, cargo, tipoContrato, tipo });
      if (!result.ok) setError(result.error ?? "No fue posible guardar.");
      if (result.ok) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{personal ? "Editar personal" : "Nuevo personal"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Nombre">
            <Input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Nombre completo" />
          </FieldWrap>
          <FieldWrap label="RUT">
            <Input value={rut} onChange={(event) => setRut(event.target.value)} placeholder="XX.XXX.XXX-X" />
          </FieldWrap>
          <FieldWrap label="Cargo">
            <Input value={cargo} onChange={(event) => setCargo(event.target.value)} placeholder="Instalador" />
          </FieldWrap>
          <FieldWrap label="Tipo contrato">
            <Select value={tipoContrato} onChange={(event) => setTipoContrato(event.target.value as TipoContrato)}>
              <option value="PLAZO_FIJO">PLAZO FIJO</option>
              <option value="INDEFINIDO">INDEFINIDO</option>
            </Select>
          </FieldWrap>
          <FieldWrap label="Tipo personal">
            <Select value={tipo} onChange={(event) => setTipo(event.target.value as TipoPersonal)}>
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
