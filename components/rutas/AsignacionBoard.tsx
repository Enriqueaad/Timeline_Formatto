"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from "@/components/ui/table";
import { CambiarSupervisorDialog } from "./CambiarSupervisorDialog";

type SupervisorOption = {
  id: string;
  nombre: string;
};

type AsignacionActiva = {
  supervisorId: string;
  supervisorNombre: string;
  desde: string; // ISO date string
} | null;

type HistorialItem = {
  supervisorNombre: string;
  desde: string;
  hasta: string;
};

export type ProyectoRow = {
  id: string;
  nombre: string;
  estado: string;
  asignacionActiva: AsignacionActiva;
  historial: HistorialItem[];
};

type Props = {
  proyectos: ProyectoRow[];
  supervisores: SupervisorOption[];
};

function formatFecha(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(iso));
}

export function AsignacionBoard({ proyectos, supervisores }: Props) {
  const [modal, setModal] = useState<ProyectoRow | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  return (
    <>
      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Supervisor asignado</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proyectos.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                  Sin proyectos activos.
                </TableCell>
              </TableRow>
            ) : proyectos.map((proyecto) => (
              <>
                <TableRow key={proyecto.id}>
                  {/* Proyecto */}
                  <TableCell className="font-semibold text-formatto-grafito">
                    {proyecto.nombre}
                    {proyecto.historial.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandido(expandido === proyecto.id ? null : proyecto.id)}
                        className="ml-2 text-2xs text-formatto-bark underline underline-offset-2"
                      >
                        {expandido === proyecto.id ? "ocultar historial" : `ver historial (${proyecto.historial.length})`}
                      </button>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Badge variant="secondary" className="text-2xs uppercase tracking-widest">
                      {proyecto.estado.toLowerCase()}
                    </Badge>
                  </TableCell>

                  {/* Supervisor */}
                  <TableCell>
                    {proyecto.asignacionActiva ? (
                      <span className="font-medium text-formatto-grafito">
                        {proyecto.asignacionActiva.supervisorNombre}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Sin asignar</span>
                    )}
                  </TableCell>

                  {/* Desde */}
                  <TableCell>
                    {proyecto.asignacionActiva ? (
                      <span className="text-sm text-formatto-umber">
                        {formatFecha(proyecto.asignacionActiva.desde)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Acción */}
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setModal(proyecto)}
                    >
                      Cambiar
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Historial expandible */}
                {expandido === proyecto.id && proyecto.historial.map((h, i) => (
                  <TableRow key={`${proyecto.id}-h-${i}`} className="bg-muted/30 hover:bg-muted/40">
                    <TableCell className="pl-8 text-sm text-muted-foreground italic" colSpan={2}>
                      Rotación anterior
                    </TableCell>
                    <TableCell className="text-sm text-formatto-umber">{h.supervisorNombre}</TableCell>
                    <TableCell className="text-sm text-formatto-umber">
                      {formatFecha(h.desde)} → {formatFecha(h.hasta)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {modal && (
        <CambiarSupervisorDialog
          proyectoId={modal.id}
          proyectoNombre={modal.nombre}
          supervisorActualId={modal.asignacionActiva?.supervisorId ?? null}
          supervisores={supervisores}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
