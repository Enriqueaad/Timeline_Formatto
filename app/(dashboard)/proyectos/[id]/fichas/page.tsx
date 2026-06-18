import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { FichasForm } from "@/components/proyectos/FichasForm";

export const dynamic = "force-dynamic";

export default async function FichasProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    select: { id: true, nombre: true },
  });
  if (!proyecto) notFound();

  // Códigos de ficha presentes en los items (para guiar al usuario sobre qué subir).
  const items = await prisma.itemInstalacion.findMany({
    where: { unidad: { proyectoId: id }, fichaCodigo: { not: null } },
    select: { fichaCodigo: true },
    distinct: ["fichaCodigo"],
    orderBy: { fichaCodigo: "asc" },
  });
  const codigos = items.map((i) => i.fichaCodigo).filter(Boolean) as string[];

  return (
    <>
      <PageHeader
        eyebrow={proyecto.nombre}
        title="Fichas de receta"
        subtitle="Recetas de muebles de closet y piernas"
        actions={
          <Link href={`/proyectos/${proyecto.id}`} className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
            Volver al proyecto
          </Link>
        }
      />

      {codigos.length > 0 && (
        <div className="bg-white border border-border p-4 mb-6 text-sm text-formatto-umber">
          <span className="font-semibold text-formatto-grafito">Fichas usadas en este proyecto ({codigos.length}):</span>{" "}
          {codigos.join(", ")}
        </div>
      )}

      <FichasForm proyectoId={proyecto.id} />
    </>
  );
}
