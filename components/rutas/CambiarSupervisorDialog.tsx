"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Select } from "@/components/ui/FormField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { asignarSupervisor, desasignarSupervisor } from "@/lib/actions/asignacionSupervisor";

type SupervisorOption = {
  id: string;
  nombre: string;
};

type Props = {
  proyectoId: string;
  proyectoNombre: string;
  supervisorActualId: string | null;
  supervisores: SupervisorOption[];
  onClose: () => void;
};

export function CambiarSupervisorDialog({
  proyectoId,
  proyectoNombre,
  supervisorActualId,
  supervisores,
  onClose,
}: Props) {
  const [supervisorId, setSupervisorId] = useState(supervisorActualId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function guardar() {
    setError(null);
    startTransition(async () => {
      const result = supervisorId
        ? await asignarSupervisor({ supervisorId, proyectoId })
        : await desasignarSupervisor({ proyectoId });

      if (!result.ok) {
        setError(result.error ?? "No fue posible guardar.");
        return;
      }
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar supervisor — {proyectoNombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FieldWrap label="Supervisor responsable">
            <Select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
            >
              <option value="">— Sin asignar —</option>
              {supervisores.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>
          </FieldWrap>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={guardar} loading={isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
