"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeptoCard, TIPO_MUEBLE_LABEL, type DeptoData } from "./DeptoCard";
import { EstadoBadge } from "@/components/ui/EstadoBadge";

export type PisoGrupo = { piso: string; deptos: DeptoData[] };

type UnidadesVistaProps = {
  proyectoId: string;
  pisos: PisoGrupo[];
};

function pctCompletado(deptos: DeptoData[]) {
  if (deptos.length === 0) return 0;
  const done = deptos.filter((d) => d.estado === "COMPLETADO").length;
  return Math.round((done / deptos.length) * 100);
}

export function UnidadesVista({ proyectoId, pisos }: UnidadesVistaProps) {
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");

  useEffect(() => {
    const saved = localStorage.getItem("unidades-vista");
    if (saved === "tarjetas" || saved === "tabla") setVista(saved);
  }, []);

  function cambiarVista(v: "tarjetas" | "tabla") {
    setVista(v);
    localStorage.setItem("unidades-vista", v);
  }

  const total = pisos.reduce((s, p) => s + p.deptos.length, 0);
  if (total === 0) {
    return (
      <div className="bg-white border border-border p-8 text-center">
        <p className="text-formatto-umber mb-4">Sin unidades cargadas para este filtro.</p>
        <Link href={`/proyectos/${proyectoId}/carga`} className="inline-flex rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
          Cargar Excel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle de vista */}
      <div className="flex justify-end gap-1">
        {(["tarjetas", "tabla"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => cambiarVista(v)}
            className={[
              "px-3 py-1.5 text-2xs font-semibold uppercase tracking-widest border",
              vista === v ? "bg-formatto-grafito text-white border-formatto-grafito" : "bg-white text-formatto-bark border-border",
            ].join(" ")}
          >
            {v === "tarjetas" ? "Tarjetas" : "Tabla"}
          </button>
        ))}
      </div>

      {vista === "tarjetas" ? (
        <div className="space-y-8">
          {pisos.map((p) => (
            <section key={p.piso}>
              {/* Encabezado de piso */}
              <div className="flex items-baseline justify-between border-b border-border pb-2 mb-4">
                <p className="text-2xs font-semibold uppercase tracking-[0.1em] text-formatto-bark">— Piso {p.piso}</p>
                <p className="text-2xs text-formatto-bark">
                  {p.deptos.length} deptos · <span className="font-black text-formatto-grafito">{pctCompletado(p.deptos)}%</span> completado
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {p.deptos.map((d) => (
                  <DeptoCard key={d.id} proyectoId={proyectoId} depto={d} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-white overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-2xs uppercase tracking-widest text-formatto-bark">
                <th className="text-left p-3">Piso</th>
                <th className="text-left p-3">Dpto</th>
                <th className="text-left p-3">Torre</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Muebles</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pisos.flatMap((p) => p.deptos).map((d) => (
                <tr key={d.id} className="border-b border-border/60">
                  <td className="p-3">{d.piso}</td>
                  <td className="p-3 font-semibold text-formatto-grafito">{d.dpto}</td>
                  <td className="p-3">{d.torre ?? "-"}</td>
                  <td className="p-3">{d.tipo ?? "-"}</td>
                  <td className="p-3 text-2xs text-formatto-bark">{d.muebles.map((m) => TIPO_MUEBLE_LABEL[m.tipoMueble]).join(", ") || "-"}</td>
                  <td className="p-3"><EstadoBadge estado={d.estado} /></td>
                  <td className="p-3 text-right">
                    <Link href={`/proyectos/${proyectoId}/unidades/${d.id}`} className="text-formatto-grafito underline underline-offset-2 text-2xs">Ver detalle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
