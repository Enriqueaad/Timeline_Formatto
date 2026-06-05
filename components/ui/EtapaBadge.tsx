import type { EtapaInstalacion } from "@prisma/client";
import { cn } from "@/lib/utils";

const ETAPA_LABELS: Record<EtapaInstalacion, string> = {
  PEDIDO:           "Pedido",
  FABRICACION:      "Fabricación",
  DESPACHO:         "Despacho",
  INSTALACION:      "Instalación",
  ENTREGA_CONFORME: "Entrega Conforme",
  ATRASADO:         "Atrasado",
  OBSERVACION:      "Observación",
};

const ETAPA_CLASSES: Record<EtapaInstalacion, string> = {
  PEDIDO:           "bg-muted text-formatto-bark",
  FABRICACION:      "bg-secondary text-formatto-umber",
  DESPACHO:         "border border-border text-formatto-grafito",
  INSTALACION:      "bg-formatto-grafito text-white",
  ENTREGA_CONFORME: "border border-border text-formatto-grafito bg-white",
  ATRASADO:         "bg-primary text-primary-foreground",
  OBSERVACION:      "border border-primary text-primary bg-transparent",
};

interface EtapaBadgeProps {
  etapa: EtapaInstalacion;
  className?: string;
}

export function EtapaBadge({ etapa, className = "" }: EtapaBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider rounded-sm",
        ETAPA_CLASSES[etapa],
        className
      )}
    >
      {ETAPA_LABELS[etapa]}
    </span>
  );
}
