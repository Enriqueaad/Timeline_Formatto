"use client";

import type { PreviewResponse } from "@/lib/excel/types";
import { TipoDetector } from "./TipoDetector";

type ExcelPreviewProps = {
  data: PreviewResponse | null;
  loading: boolean;
};

export function ExcelPreview({ data, loading }: ExcelPreviewProps) {
  if (loading) {
    return (
      <div className="bg-formatto-cream border border-formatto-sand p-6 rounded-none">
        <div className="h-4 w-40 bg-formatto-sand animate-pulse mb-4" />
        <div className="h-24 bg-formatto-linen animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const columns = data.preview[0] ? Object.keys(data.preview[0]).slice(0, 8) : [];

  return (
    <div className="bg-white border border-formatto-sand rounded-none overflow-hidden">
      <div className="bg-formatto-cream border-b border-formatto-sand p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-2">Vista previa</p>
          <TipoDetector tipo={data.tipo} />
        </div>
        <div className="grid grid-cols-3 gap-6 text-right">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Unidades</p>
            <p className="text-xl font-black text-formatto-grafito">{data.unidades}</p>
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Items</p>
            <p className="text-xl font-black text-formatto-grafito">{data.resumen.totalItems}</p>
          </div>
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Filas</p>
            <p className="text-xl font-black text-formatto-grafito">{data.filasLeidas}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-formatto-sand text-xs text-formatto-umber">
        Tipos detectados: {data.resumen.tipos.length > 0 ? data.resumen.tipos.join(", ") : "Sin tipos"}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-formatto-cream text-formatto-grafito font-semibold text-sm">
            <tr>
              {columns.map((column) => (
                <th key={column} className="text-left p-3 border-b border-formatto-sand whitespace-nowrap">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.preview.length === 0 ? (
              <tr><td className="p-6 text-center text-formatto-bark" colSpan={Math.max(columns.length, 1)}>Sin filas para previsualizar.</td></tr>
            ) : (
              data.preview.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white text-formatto-umber" : "bg-formatto-linen text-formatto-umber"}>
                  {columns.map((column) => (
                    <td key={column} className="p-3 border-b border-formatto-sand whitespace-nowrap">{row[column] ?? "-"}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
