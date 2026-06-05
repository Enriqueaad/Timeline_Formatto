import { cn } from "@/lib/utils";

/**
 * Punto — el cuadrito de marca Formatto (#D35132).
 * Acento minimalista que se usa después de títulos, ej: "Nosotros[.]".
 */
export function Punto({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block bg-primary align-baseline", className)}
      style={{ width: "0.5em", height: "0.5em" }}
    />
  );
}
