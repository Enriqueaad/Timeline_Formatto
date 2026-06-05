import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";

const reportes = [
  {
    title: "Actas de conformidad",
    description: "Documentos de entrega por proyecto y unidad completada.",
    href: "/proyectos",
  },
  {
    title: "Reportes de dotacion",
    description: "Personal activo, costos mensuales y evaluaciones por proyecto.",
    href: "/dotacion",
  },
  {
    title: "Rutas de supervisores",
    description: "Plan semanal de visitas y exportacion a PDF.",
    href: "/supervisores",
  },
];

export default function ReportesPage() {
  return (
    <>
      <PageHeader eyebrow="Analisis" title="Reportes" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {reportes.map((reporte) => (
          <Link
            key={reporte.href}
            href={reporte.href}
            className="group bg-white border border-border p-6 min-h-44 flex flex-col justify-between hover:border-formatto-rojo transition-colors"
          >
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-3">Reporte</p>
              <h2 className="text-xl font-light text-formatto-grafito mb-3">{reporte.title}</h2>
              <p className="text-sm text-formatto-umber">{reporte.description}</p>
            </div>
            <span className="text-2xs font-semibold uppercase tracking-widest text-formatto-rojo mt-6">
              Abrir modulo
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
