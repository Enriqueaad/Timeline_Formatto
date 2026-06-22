import type { EstadoAvance } from "@prisma/client";
import { ESTADOS } from "@/lib/instalacion/estados";

type EstadoBadgeProps = {
  estado: EstadoAvance;
  className?: string;
};

export function EstadoBadge({ estado, className = "" }: EstadoBadgeProps) {
  const cfg = ESTADOS[estado];
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-1 text-2xs font-semibold uppercase tracking-widest ${cfg.bgClass} ${cfg.textClass} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
