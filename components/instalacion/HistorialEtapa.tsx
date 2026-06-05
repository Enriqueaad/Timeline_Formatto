import type { EtapaInstalacion } from "@prisma/client";
import { EtapaBadge } from "@/components/ui/EtapaBadge";

type HistorialRow = {
  id?: string;
  etapa: EtapaInstalacion;
  fecha: Date;
  usuario: string;
  nota: string | null;
};

type HistorialEtapaProps = {
  historial: HistorialRow[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function HistorialEtapa({ historial }: HistorialEtapaProps) {
  return (
    <section className="bg-white border border-border rounded-none p-6">
      <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-5">
        - Historial de cambios
      </p>
      {historial.length === 0 ? (
        <p className="text-sm text-formatto-umber">Sin movimientos registrados.</p>
      ) : (
        <div className="space-y-4">
          {historial.map((row, index) => (
            <div key={row.id ?? `${row.etapa}-${index}`} className="grid grid-cols-[14px_150px_180px_1fr] gap-3 text-sm text-formatto-umber">
              <span className="mt-1 h-2 w-2 bg-formatto-grafito rounded-full" />
              <span>{formatDate(row.fecha)}</span>
              <EtapaBadge etapa={row.etapa} />
              <span>
                <span className="font-semibold text-formatto-grafito">{row.usuario}</span>
                {row.nota ? ` · ${row.nota}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
