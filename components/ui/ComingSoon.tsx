interface ComingSoonProps {
  fase: string;
  descripcion?: string;
}

export function ComingSoon({ fase, descripcion }: ComingSoonProps) {
  return (
    <div className="bg-white border border-border p-6 rounded-none text-formatto-umber text-sm font-light">
      <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-3">
        - Modulo en desarrollo · Disponible en Fase {fase}
      </p>
      {descripcion && <p>{descripcion}</p>}
    </div>
  );
}
