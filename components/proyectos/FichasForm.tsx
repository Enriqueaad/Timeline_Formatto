"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ResultadoFicha = { ficha: string; piezas: number; items: number; recetas: number; nota?: string };

export function FichasForm({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoFicha[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  function cargar() {
    if (files.length === 0) return;
    setMessage(null);
    setResultado(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        for (const f of files) fd.append("fichas", f);
        const res = await fetch(`/api/proyectos/${proyectoId}/fichas`, { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No fue posible cargar las fichas.");
        setResultado(json.fichas ?? []);
        setTotal(json.totalRecetas ?? 0);
        setMessage(`Listo: ${json.totalRecetas} recetas creadas desde ${json.fichas?.length ?? 0} fichas.`);
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "No fue posible cargar las fichas.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border border-border p-6 space-y-4">
        <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Fichas de receta (closet / piernas)</p>
        <p className="text-sm text-formatto-umber">
          Sube los archivos de ficha (<span className="font-mono">C01.xlsm … C28.xlsm</span>). Cada ficha aporta las piezas/materiales
          del mueble y se asigna automáticamente a todos los items que la usan (por su código de ficha).
        </p>
        <input
          type="file"
          accept=".xlsm,.xlsx"
          multiple
          disabled={isPending}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm text-formatto-umber file:mr-3 file:border file:border-border file:bg-white file:px-3 file:py-1.5 file:text-2xs file:font-semibold file:uppercase file:tracking-widest"
        />
        {files.length > 0 && (
          <p className="text-2xs text-formatto-bark">{files.length} archivo(s) seleccionado(s).</p>
        )}
        <div className="flex justify-end">
          <Button type="button" variant="primary" loading={isPending} disabled={files.length === 0} onClick={cargar}>
            Cargar fichas
          </Button>
        </div>
        {message && <p className="text-sm text-formatto-umber">{message}</p>}
      </section>

      {resultado && (
        <section className="border border-border bg-white">
          <div className="border-b border-border p-4 text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
            Resultado {total != null && <span className="text-formatto-grafito">· {total} recetas</span>}
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-2xs uppercase tracking-widest text-formatto-bark">
                <th className="text-left p-2 font-semibold">Ficha</th>
                <th className="text-right p-2 font-semibold">Piezas</th>
                <th className="text-right p-2 font-semibold">Items</th>
                <th className="text-right p-2 font-semibold">Recetas</th>
                <th className="text-left p-2 font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((r, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="p-2 font-semibold text-formatto-grafito">{r.ficha}</td>
                  <td className="p-2 text-right">{r.piezas}</td>
                  <td className="p-2 text-right">{r.items}</td>
                  <td className="p-2 text-right">{r.recetas}</td>
                  <td className="p-2 text-2xs text-formatto-bark">{r.nota ?? "✓"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
