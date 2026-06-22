"use client";

import { useEffect, useRef, useState } from "react";
import type { EstadoAvance } from "@prisma/client";
import { ESTADOS, ESTADOS_LISTA } from "@/lib/instalacion/estados";
import { EstadoBadge } from "@/components/ui/EstadoBadge";

type EstadoPickerProps = {
  estado: EstadoAvance;
  onSelect: (estado: EstadoAvance) => void;
  disabled?: boolean;
  // Opción extra al final del menú (ej. "Auto" para liberar override del depto).
  extra?: { label: string; onClick: () => void };
};

// Badge clickeable que abre un menú con los estados disponibles. Marcado rápido de terreno.
export function EstadoPicker({ estado, onSelect, disabled, extra }: EstadoPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer disabled:cursor-wait disabled:opacity-60"
        aria-label="Cambiar estado"
      >
        <EstadoBadge estado={estado} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[9rem] border border-border bg-white shadow-sm">
          {ESTADOS_LISTA.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setOpen(false);
                if (e !== estado) onSelect(e);
              }}
              className={[
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-formatto-linen",
                e === estado ? "font-semibold text-formatto-grafito" : "text-formatto-bark",
              ].join(" ")}
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${ESTADOS[e].bgClass}`} />
              {ESTADOS[e].label}
            </button>
          ))}
          {extra && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                extra.onClick();
              }}
              className="block w-full border-t border-border px-3 py-2 text-left text-2xs uppercase tracking-widest text-formatto-bark hover:bg-formatto-linen"
            >
              {extra.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
