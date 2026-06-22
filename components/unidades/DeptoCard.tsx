"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { EstadoAvance, TipoMueble } from "@prisma/client";
import { EstadoBadge } from "@/components/ui/EstadoBadge";
import { EstadoPicker } from "./EstadoPicker";
import { derivarEstadoDepto } from "@/lib/instalacion/estados";
import { marcarEstadoMueble, setEstadoUnidad } from "@/lib/actions/estado";

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
  const [muebles, setMuebles] = useState<MuebleEstado[]>(depto.muebles);
  const [estadoDepto, setEstadoDepto] = useState<EstadoAvance>(depto.estado);
  const [manual, setManual] = useState<boolean>(depto.estadoManual);
  const [pending, startTransition] = useTransition();

  function marcarMueble(tipoMueble: TipoMueble, estado: EstadoAvance) {
    const prevMuebles = muebles;
    const prevEstado = estadoDepto;
    const nuevos = muebles.map((m) => (m.tipoMueble === tipoMueble ? { ...m, estado } : m));
    setMuebles(nuevos);
    // Si el depto no está forzado a mano, derivamos optimistamente.
    if (!manual) setEstadoDepto(derivarEstadoDepto(nuevos.map((m) => m.estado)));

    startTransition(async () => {
      const res = await marcarEstadoMueble({ proyectoId, unidadId: depto.id, tipoMueble, estado });
      if (!res.ok) {
        setMuebles(prevMuebles);
        setEstadoDepto(prevEstado);
      } else if (res.estadoDepto) {
        setEstadoDepto(res.estadoDepto);
      }
    });
  }

  function forzarDepto(estado: EstadoAvance) {
    const prev = { estado: estadoDepto, manual };
    setEstadoDepto(estado);
    setManual(true);
    startTransition(async () => {
      const res = await setEstadoUnidad({ proyectoId, unidadId: depto.id, estado });
      if (!res.ok) {
        setEstadoDepto(prev.estado);
        setManual(prev.manual);
      }
    });
  }

  function liberarDepto() {
    const prev = { estado: estadoDepto, manual };
    setManual(false);
    setEstadoDepto(derivarEstadoDepto(muebles.map((m) => m.estado)));
    startTransition(async () => {
      const res = await setEstadoUnidad({ proyectoId, unidadId: depto.id, estado: null });
      if (!res.ok) {
        setEstadoDepto(prev.estado);
        setManual(prev.manual);
      } else if (res.estadoDepto) {
        setEstadoDepto(res.estadoDepto);
      }
    });
  }

  return (
    <div className="bg-formatto-cream border border-formatto-sand p-4 flex flex-col gap-3">
      {/* Cabecera: depto + estado general (override manual desde el picker) */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-black text-formatto-grafito leading-none">{depto.dpto}</p>
          <p className="text-2xs text-formatto-bark mt-1">
            {depto.tipo ?? "—"}{depto.torre ? ` · Torre ${depto.torre}` : ""}
            {manual ? " · manual" : ""}
          </p>
        </div>
        <EstadoPicker
          estado={estadoDepto}
          disabled={pending}
          onSelect={forzarDepto}
          extra={manual ? { label: "Auto (derivar)", onClick: liberarDepto } : undefined}
        />
      </div>

      {/* Estado por tipo de mueble — clic en el badge para marcar */}
      <div className="flex flex-col gap-1.5">
        {muebles.length === 0 ? (
          <p className="text-2xs text-formatto-bark italic">Sin muebles cargados</p>
        ) : (
          muebles.map((m) => (
            <div key={m.tipoMueble} className="flex items-center justify-between gap-2">
              <span className="text-xs text-formatto-grafito">{TIPO_MUEBLE_LABEL[m.tipoMueble]}</span>
              <EstadoPicker
                estado={m.estado}
                disabled={pending}
                onSelect={(e) => marcarMueble(m.tipoMueble, e)}
              />
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
