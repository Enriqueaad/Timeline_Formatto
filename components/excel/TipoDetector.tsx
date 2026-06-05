import type { TipoExcel } from "@/lib/excel/types";

type TipoDetectorProps = {
  tipo: TipoExcel;
};

const TIPO_CLASSES: Record<TipoExcel, string> = {
  COCINA: "bg-formatto-grafito text-white",
  CLOSET_INTERIOR: "bg-formatto-umber text-white",
  PIERNAS: "bg-formatto-bark text-white",
  OTRO: "bg-formatto-sand text-formatto-grafito",
};

const TIPO_LABELS: Record<TipoExcel, string> = {
  COCINA: "COCINA",
  CLOSET_INTERIOR: "CLOSET INTERIOR",
  PIERNAS: "PIERNAS",
  OTRO: "OTRO",
};

export function TipoDetector({ tipo }: TipoDetectorProps) {
  return (
    <span className={`inline-flex rounded-sm px-2 py-1 text-2xs font-semibold uppercase tracking-widest ${TIPO_CLASSES[tipo]}`}>
      {TIPO_LABELS[tipo]}
    </span>
  );
}
