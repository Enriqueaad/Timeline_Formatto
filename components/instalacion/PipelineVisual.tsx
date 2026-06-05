import type { EtapaInstalacion } from "@prisma/client";
import { EtapaBadge } from "@/components/ui/EtapaBadge";

type PipelineVisualProps = {
  conteosPorEtapa: Record<EtapaInstalacion, number>;
  total: number;
};

const ETAPAS_PRINCIPALES: EtapaInstalacion[] = [
  "PEDIDO",
  "FABRICACION",
  "DESPACHO",
  "INSTALACION",
  "ENTREGA_CONFORME",
];

const ETAPA_LABELS: Record<EtapaInstalacion, string> = {
  PEDIDO: "Pedido",
  FABRICACION: "Fabricacion",
  DESPACHO: "Despacho",
  INSTALACION: "Instalacion",
  ENTREGA_CONFORME: "Entrega conforme",
  ATRASADO: "Atrasado",
  OBSERVACION: "Observacion",
};

export function PipelineVisual({ conteosPorEtapa, total }: PipelineVisualProps) {
  const denominator = Math.max(total, 1);

  return (
    <section className="bg-white border border-border p-6 rounded-none">
      <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-5">
        - Pipeline de instalacion
      </p>
      <div className="grid grid-cols-5 gap-4">
        {ETAPAS_PRINCIPALES.map((etapa) => {
          const count = conteosPorEtapa[etapa] ?? 0;
          const width = `${Math.round((count / denominator) * 100)}%`;
          const fill = etapa === "ENTREGA_CONFORME" && count > 0 ? "bg-formatto-rojo" : "bg-formatto-grafito";
          return (
            <div key={etapa} className="space-y-2">
              <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
                {ETAPA_LABELS[etapa]}
              </p>
              <p className="text-xl font-black text-formatto-grafito">{count}</p>
              <div className="h-1 bg-formatto-sand rounded-none overflow-hidden">
                <div className={`h-1 rounded-none ${fill}`} style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>

      {(conteosPorEtapa.ATRASADO > 0 || conteosPorEtapa.OBSERVACION > 0) && (
        <div className="mt-5 flex items-center gap-2">
          {conteosPorEtapa.ATRASADO > 0 && (
            <span className="inline-flex items-center gap-2">
              <EtapaBadge etapa="ATRASADO" />
              <span className="text-sm text-formatto-umber">{conteosPorEtapa.ATRASADO}</span>
            </span>
          )}
          {conteosPorEtapa.OBSERVACION > 0 && (
            <span className="inline-flex items-center gap-2">
              <EtapaBadge etapa="OBSERVACION" />
              <span className="text-sm text-formatto-umber">{conteosPorEtapa.OBSERVACION}</span>
            </span>
          )}
        </div>
      )}
    </section>
  );
}
