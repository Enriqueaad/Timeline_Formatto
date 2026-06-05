"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input } from "@/components/ui/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { crearSupervisor, editarSupervisor } from "@/lib/actions/supervisor";

export type SupervisorRow = {
  id: string;
  nombre: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
};

type SupervisorModalProps = {
  supervisor?: SupervisorRow;
  onClose: () => void;
};

export function SupervisorModal({ supervisor, onClose }: SupervisorModalProps) {
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(supervisor?.nombre ?? "");
  const [rut, setRut] = useState(supervisor?.rut ?? "");
  const [email, setEmail] = useState(supervisor?.email ?? "");
  const [telefono, setTelefono] = useState(supervisor?.telefono ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (nombre.trim().length < 3) {
      setError("Nombre requerido.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const data = { nombre, rut, email, telefono };
      const result = supervisor ? await editarSupervisor(supervisor.id, data) : await crearSupervisor(data);
      if (!result.ok) setError(result.error ?? "No fue posible guardar.");
      if (result.ok) onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supervisor ? "Editar supervisor" : "Nuevo supervisor"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Nombre">
            <Input value={nombre} onChange={(event) => setNombre(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="RUT">
            <Input value={rut} onChange={(event) => setRut(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Email">
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FieldWrap>
          <FieldWrap label="Telefono">
            <Input value={telefono} onChange={(event) => setTelefono(event.target.value)} />
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
