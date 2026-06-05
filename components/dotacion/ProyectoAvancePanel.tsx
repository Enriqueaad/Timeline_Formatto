"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AvanceChart } from "./AvanceChart";
import { AvanceModal } from "./AvanceModal";

type ProyectoAvancePanelProps = {
  proyectoId: string;
  unidadesTotales: number;
  datos: Array<{ fecha: string; porcentaje: number }>;
};

export function ProyectoAvancePanel({ proyectoId, unidadesTotales, datos }: ProyectoAvancePanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Avance de obra</p>
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>Registrar avance</Button>
      </div>
      <AvanceChart datos={datos} />
      {open && <AvanceModal proyectoId={proyectoId} unidadesTotales={unidadesTotales} onClose={() => setOpen(false)} />}
    </section>
  );
}
