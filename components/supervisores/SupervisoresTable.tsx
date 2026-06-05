"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SupervisorModal, type SupervisorRow } from "./SupervisorModal";
import { toggleActivo } from "@/lib/actions/supervisor";

type SupervisorTableRow = SupervisorRow & {
  paradasSemana: number;
};

type SupervisoresTableProps = {
  rows: SupervisorTableRow[];
};

export function SupervisoresTable({ rows }: SupervisoresTableProps) {
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<SupervisorRow | "new" | null>(null);

  function toggle(id: string) {
    startTransition(async () => {
      await toggleActivo(id);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => setModal("new")}>Nuevo supervisor</Button>
      </div>
      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Rutas esta semana</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={7} className="p-8 text-center text-formatto-bark">Sin supervisores cargados.</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} className={row.activo ? "" : "opacity-50"}>
                <TableCell className="font-semibold text-formatto-grafito">{row.nombre}</TableCell>
                <TableCell>{row.rut ?? "-"}</TableCell>
                <TableCell>{row.email ?? "-"}</TableCell>
                <TableCell>{row.telefono ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={row.activo ? "outline" : "secondary"}
                    className={row.activo ? "border-formatto-grafito bg-formatto-grafito text-white" : ""}>
                    {row.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{row.paradasSemana}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/supervisores/${row.id}`}>Ver rutas</Link>
                    </Button>
                    <Button asChild variant="primary" size="sm">
                      <Link href={`/supervisores/${row.id}/ruta`}>Planificar</Link>
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setModal(row)}>Editar</Button>
                    <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => toggle(row.id)}>{row.activo ? "Desactivar" : "Activar"}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {modal && <SupervisorModal supervisor={modal === "new" ? undefined : modal} onClose={() => setModal(null)} />}
    </>
  );
}
