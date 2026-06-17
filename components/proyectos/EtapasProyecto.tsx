import Link from "next/link";

export type EtapaProyecto = {
  n: number;
  titulo: string;
  descripcion: string;
  completa: boolean;
  href?: string;        // CTA principal
  cta?: string;         // texto del CTA
  proximamente?: boolean;
};

export function EtapasProyecto({ etapas }: { etapas: EtapaProyecto[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {etapas.map((e) => (
        <div
          key={e.n}
          className={[
            "border p-4 flex flex-col gap-2",
            e.completa ? "border-emerald-300 bg-emerald-50" : "border-border bg-white",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
              Etapa {e.n}
            </span>
            {e.completa ? (
              <span className="text-emerald-700 text-2xs font-bold">✓ Lista</span>
            ) : e.proximamente ? (
              <span className="text-formatto-bark text-2xs">Próximamente</span>
            ) : (
              <span className="text-amber-600 text-2xs font-semibold">Pendiente</span>
            )}
          </div>
          <p className="font-semibold text-formatto-grafito leading-tight">{e.titulo}</p>
          <p className="text-2xs text-formatto-bark flex-1">{e.descripcion}</p>
          {e.href && !e.proximamente && (
            <Link
              href={e.href}
              className="text-2xs font-semibold uppercase tracking-widest text-formatto-grafito underline underline-offset-2"
            >
              {e.cta ?? "Completar"}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
