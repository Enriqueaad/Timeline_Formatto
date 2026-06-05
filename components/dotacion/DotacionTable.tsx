"use client";

import { useState, useTransition } from "react";
import type { EstadoPersonal, TipoContrato, TipoPersonal } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { EvaluacionBadge } from "@/components/ui/EvaluacionBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PersonalModal, type PersonalModalRow } from "./PersonalModal";
import { EvaluarModal } from "./EvaluarModal";
import { MoverPersonalModal } from "./MoverPersonalModal";
import { desvincularPersonal } from "@/lib/actions/personal";

type ProyectoOption = { id: string; nombre: string };

export type DotacionRow = {
  id: string;
  nombreCompleto: string;
  rut: string;
  cargo: string;
  tipoContrato: TipoContrato;
  tipo: TipoPersonal;
  estado: EstadoPersonal;
  proyectoActual: { id: string; nombre: string } | null;
  ultimaEvaluacion: number | null;
  costoMensual: number; // costo de la asignación activa (para quick-move en tablero)
};

type DotacionTableProps = {
  rows: DotacionRow[];
  proyectos: ProyectoOption[];
};

export function DotacionTable({ rows, proyectos }: DotacionTableProps) {
  const [isPending, startTransition] = useTransition();
  const [personalModal, setPersonalModal] = useState<PersonalModalRow | null | "new">(null);
  const [evaluar, setEvaluar] = useState<DotacionRow | null>(null);
  const [mover, setMover] = useState<DotacionRow | null>(null);

  function desvincular(id: string) {
    startTransition(async () => {
      await desvincularPersonal(id);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => setPersonalModal("new")}>Nuevo personal</Button>
      </div>
      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Tipo contrato</TableHead>
              <TableHead>Proyecto actual</TableHead>
              <TableHead>Última evaluación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-8 text-center text-formatto-bark">
                  Sin personal cargado en Prisma.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const activo = row.estado !== "DESVINCULADO" && row.estado !== "INACTIVO";
                return (
                  <TableRow key={row.id} className={activo ? "" : "opacity-50"}>
                    <TableCell className="font-semibold text-formatto-grafito">{row.nombreCompleto}</TableCell>
                    <TableCell>{row.rut}</TableCell>
                    <TableCell>{row.cargo}</TableCell>
                    <TableCell>{row.tipoContrato}</TableCell>
                    <TableCell>{row.proyectoActual?.nombre ?? "-"}</TableCell>
                    <TableCell>
                      {row.ultimaEvaluacion ? <EvaluacionBadge nota={row.ultimaEvaluacion} showLabel /> : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {activo ? (
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setEvaluar(row)}>Evaluar</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setMover(row)}>Mover</Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => setPersonalModal(row)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={() => desvincular(row.id)}>Desvincular</Button>
                        </div>
                      ) : (
                        <span className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">{row.estado}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {personalModal && (
        <PersonalModal
          personal={personalModal === "new" ? undefined : personalModal}
          onClose={() => setPersonalModal(null)}
        />
      )}
      {evaluar && (
        <EvaluarModal
          personalId={evaluar.id}
          nombre={evaluar.nombreCompleto}
          proyectoId={evaluar.proyectoActual?.id}
          proyectos={proyectos}
          onClose={() => setEvaluar(null)}
        />
      )}
      {mover && (
        <MoverPersonalModal
          personalId={mover.id}
          nombre={mover.nombreCompleto}
          proyectoOrigenId={mover.proyectoActual?.id}
          proyectos={proyectos}
          onClose={() => setMover(null)}
        />
      )}
    </>
  );
}
