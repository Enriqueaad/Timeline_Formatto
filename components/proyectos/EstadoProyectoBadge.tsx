type EstadoProyectoBadgeProps = {
  estado: "ACTIVO" | "PAUSADO" | "TERMINADO" | "CANCELADO";
};

const ESTADO_CLASSES: Record<EstadoProyectoBadgeProps["estado"], string> = {
  ACTIVO: "bg-formatto-grafito text-white",
  PAUSADO: "bg-formatto-sand text-formatto-grafito",
  TERMINADO: "bg-formatto-linen text-formatto-grafito",
  CANCELADO: "bg-primary text-primary-foreground",
};

export function EstadoProyectoBadge({ estado }: EstadoProyectoBadgeProps) {
  return (
    <span className={`inline-flex rounded-sm px-2 py-1 text-2xs font-semibold uppercase tracking-widest ${ESTADO_CLASSES[estado]}`}>
      {estado}
    </span>
  );
}
