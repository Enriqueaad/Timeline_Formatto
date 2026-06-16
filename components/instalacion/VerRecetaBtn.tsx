"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export type RecetaPieza = {
  id: string;
  codMaterial: string;
  descripMaterial: string | null;
  material: string | null;
  colorMaterial: string | null;
  espesor: string | null;
  largo: number | null;
  ancho: number | null;
  cantUni: number | null;
};

type VerRecetaBtnProps = {
  titulo: string;
  receta: RecetaPieza[];
};

export function VerRecetaBtn({ titulo, receta }: VerRecetaBtnProps) {
  const [open, setOpen] = useState(false);

  if (receta.length === 0) {
    return <span className="text-2xs italic text-formatto-bark">Sin receta registrada</span>;
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Ver receta ({receta.length})
      </Button>
      {open && (
        <Dialog open onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Receta · {titulo}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-right">Espesor</TableHead>
                    <TableHead className="text-right">Largo</TableHead>
                    <TableHead className="text-right">Ancho</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receta.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold text-formatto-grafito whitespace-nowrap">{p.codMaterial}</TableCell>
                      <TableCell>{p.descripMaterial ?? "-"}</TableCell>
                      <TableCell>{p.material ?? "-"}</TableCell>
                      <TableCell>{p.colorMaterial ?? "-"}</TableCell>
                      <TableCell className="text-right">{p.espesor ?? "-"}</TableCell>
                      <TableCell className="text-right">{p.largo ?? "-"}</TableCell>
                      <TableCell className="text-right">{p.ancho ?? "-"}</TableCell>
                      <TableCell className="text-right">{p.cantUni ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
