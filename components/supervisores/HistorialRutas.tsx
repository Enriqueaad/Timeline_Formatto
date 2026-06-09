"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const DIA_ABREV: Record<string, string> = {
  LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié",
  JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb",
};
const DIA_LABEL: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado",
};
const DIA_ORDER: Record<string, number> = {
  LUNES: 0, MARTES: 1, MIERCOLES: 2, JUEVES: 3, VIERNES: 4, SABADO: 5,
};

export type ParadaHist = {
  proyectoNombre: string;
  diaVisita:      string;
  diaOriginal:    string | null;
  horaEstimada:   string | null;
  completada:     boolean;
};

export type SemanaHist = {
  rutaId:      string;
  semanaParam: string; // YYYY-MM-DD
  semanaLabel: string;
  paradas:     ParadaHist[];
};

type Props = {
  supervisorId: string;
  semanas:      SemanaHist[];
};

function resumen(paradas: ParadaHist[]) {
  return {
    total:      paradas.length,
    realizadas: paradas.filter((p) => p.completada).length,
    cambios:    paradas.filter((p) => p.diaOriginal !== null).length,
  };
}

export function HistorialRutas({ supervisorId, semanas }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null);

  if (semanas.length === 0) {
    return (
      <div className="border border-border bg-white p-8 text-center text-muted-foreground">
        Sin rutas guardadas.
      </div>
    );
  }

  return (
    <div className="border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Semana</TableHead>
            <TableHead className="text-center">Paradas</TableHead>
            <TableHead className="text-center">Realizadas</TableHead>
            <TableHead className="text-center">Cambios</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {semanas.map((semana) => {
            const r = resumen(semana.paradas);
            const expandida = abierta === semana.rutaId;
            const cumplimiento =
              r.total > 0 ? Math.round((r.realizadas / r.total) * 100) : 0;

            return (
              <React.Fragment key={semana.rutaId}>
                <TableRow>
                  <TableCell className="font-semibold text-formatto-grafito">
                    <button
                      type="button"
                      onClick={() => setAbierta(expandida ? null : semana.rutaId)}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <span className="text-muted-foreground text-xs">{expandida ? "▾" : "▸"}</span>
                      {semana.semanaLabel}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">{r.total}</TableCell>
                  <TableCell className="text-center">
                    {r.total > 0 ? (
                      <span
                        className={
                          cumplimiento === 100
                            ? "text-emerald-700 font-semibold"
                            : cumplimiento > 0
                              ? "text-formatto-grafito"
                              : "text-muted-foreground"
                        }
                      >
                        {r.realizadas}/{r.total} · {cumplimiento}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.cambios > 0 ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 text-2xs font-bold">
                        {r.cambios}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/supervisores/${supervisorId}/ruta?semana=${semana.semanaParam}`}
                      className="text-formatto-grafito underline underline-offset-2 text-sm"
                    >
                      Planificar
                    </Link>
                  </TableCell>
                </TableRow>

                {/* Detalle expandible */}
                {expandida && (
                  <TableRow className="hover:bg-transparent bg-muted/20">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4">
                        {semana.paradas.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Semana sin paradas.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {[...semana.paradas]
                              .sort((a, b) => (DIA_ORDER[a.diaVisita] ?? 9) - (DIA_ORDER[b.diaVisita] ?? 9))
                              .map((p, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 text-sm border-b border-border/50 pb-1.5 last:border-0"
                                >
                                  {/* Día */}
                                  <span className="w-20 text-2xs font-semibold uppercase tracking-widest text-formatto-bark shrink-0">
                                    {DIA_LABEL[p.diaVisita] ?? p.diaVisita}
                                  </span>
                                  {/* Proyecto */}
                                  <span className="font-medium text-formatto-grafito flex-1 min-w-0 truncate">
                                    {p.proyectoNombre}
                                  </span>
                                  {/* Periodo */}
                                  {p.horaEstimada && (
                                    <span className="text-2xs text-formatto-bark shrink-0">
                                      {p.horaEstimada}
                                    </span>
                                  )}
                                  {/* Cambio de día */}
                                  {p.diaOriginal && (
                                    <span
                                      className="bg-amber-100 text-amber-700 px-1.5 py-0.5 text-2xs font-bold shrink-0"
                                      title={`Movido desde ${DIA_LABEL[p.diaOriginal] ?? p.diaOriginal}`}
                                    >
                                      ← {DIA_ABREV[p.diaOriginal] ?? p.diaOriginal}
                                    </span>
                                  )}
                                  {/* Cumplimiento */}
                                  <span className="w-24 text-right shrink-0">
                                    {p.completada ? (
                                      <span className="text-emerald-700 text-2xs font-semibold">✓ Realizada</span>
                                    ) : (
                                      <span className="text-muted-foreground text-2xs">Pendiente</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
