import { cn } from "@/lib/utils";

const NOTA_CLASSES: Record<number, string> = {
  5: "bg-formatto-grafito text-white",
  4: "bg-formatto-umber text-white",
  3: "bg-formatto-bark text-white",
  2: "bg-muted text-formatto-grafito",
  1: "bg-primary text-primary-foreground",
};

const NOTA_LABELS: Record<number, string> = {
  5: "Excelente",
  4: "Muy Bueno",
  3: "Bueno",
  2: "Regular",
  1: "Deficiente",
};

interface EvaluacionBadgeProps {
  nota: number;
  showLabel?: boolean;
  className?: string;
}

export function EvaluacionBadge({ nota, showLabel = false, className = "" }: EvaluacionBadgeProps) {
  const cls = NOTA_CLASSES[nota] ?? "bg-muted text-formatto-grafito";
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-semibold rounded-sm", cls, className)}
    >
      <span className="font-black">{nota}</span>
      {showLabel && <span className="font-light">{NOTA_LABELS[nota]}</span>}
    </span>
  );
}
