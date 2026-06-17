"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type EliminarProyectoBtnProps = {
  proyectoId: string;
  proyectoNombre: string;
  unidades: number;
};

export function EliminarProyectoBtn({ proyectoId, proyectoNombre, unidades }: EliminarProyectoBtnProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible eliminar el proyecto.");
      router.push("/proyectos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible eliminar.");
      setDeleting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Eliminar proyecto
      </Button>
      {open && (
        <Dialog open onOpenChange={(o) => !deleting && setOpen(o)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar proyecto</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-formatto-umber">
              Se eliminará <strong className="text-formatto-grafito">{proyectoNombre}</strong> y todos sus datos
              {unidades > 0 ? ` (${unidades} unidades, items, recetas, archivos y asignaciones)` : ""}. Esta acción no se puede deshacer.
            </p>
            {error && <p className="text-sm text-primary">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="destructive" loading={deleting} onClick={eliminar}>
                Eliminar definitivamente
              </Button>
              <Button type="button" variant="secondary" disabled={deleting} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
