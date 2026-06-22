"use client";

import Link from "next/link";
import type { EstadoAvance, TipoMueble } from "@prisma/client";
import { EstadoBadge } from "@/components/ui/EstadoBadge";

export const TIPO_MUEBLE_LABEL: Record<TipoMueble, string> = {
  COCINA: "Cocina",
  CLOSET_INTERIOR: "Closet",
  PIERNAS: "Piernas",
  QUINCALLERIA: "Quincallería",
  OTRO: "Otro",
};

export type MuebleEstado = { tipoMueble: TipoMueble; estado: EstadoAvance };

export type DeptoData = {
  id: string;
  piso: string;
  dpto: string;
  torre: string | null;
  tipo: string | null;
  estado: EstadoAvance;
  estadoManual: boolean;
  muebles: MuebleEstado[];
};

type DeptoCardProps = {
  proyectoId: string;
  depto: DeptoData;
};

export function DeptoCard({ proyectoId, depto }: DeptoCardProps) {
  return (
    <div className="bg-formatto-cream border border-formatto-sand p-4 flex flex-col gap-3">
      {/* Cabecera: depto + estado general */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-black text-formatto-grafito leading-none">{depto.dpto}</p>
          <p className="text-2xs text-formatto-bark mt-1">
            {depto.tipo ?? "—"}{depto.torre ? ` · Torre ${depto.torre}` : ""}
          </p>
        </div>
        <EstadoBadge estado={depto.estado} />
      </div>

      {/* Estado por tipo de mueble */}
      <div className="flex flex-col gap-1.5">
        {depto.muebles.length === 0 ? (
          <p className="text-2xs text-formatto-bark italic">Sin muebles cargados</p>
        ) : (
          depto.muebles.map((m) => (
            <div key={m.tipoMueble} className="flex items-center justify-between gap-2">
              <span className="text-xs text-formatto-grafito">{TIPO_MUEBLE_LABEL[m.tipoMueble]}</span>
              <EstadoBadge estado={m.estado} />
            </div>
          ))
        )}
      </div>

      {/* Acceso al detalle */}
      <Link
        href={`/proyectos/${proyectoId}/unidades/${depto.id}`}
        className="text-2xs font-semibold uppercase tracking-widest text-formatto-grafito underline underline-offset-2 mt-auto"
      >
        Ver detalle
      </Link>
    </div>
  );
}
