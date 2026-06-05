import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { ProyectoCargaForm } from "@/components/proyectos/ProyectoCargaForm";
import type { TipoExcel } from "@/lib/excel/types";

export const dynamic = "force-dynamic";

export default async function ProyectoCargaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let proyecto;
  try {
    proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: { archivos: { select: { tipo: true } } },
    });
  } catch {
    proyecto = null;
  }

  if (!proyecto) notFound();

  const tiposExistentes = Array.from(new Set(proyecto.archivos.map((archivo) => archivo.tipo))) as TipoExcel[];

  return (
    <>
      <PageHeader eyebrow="Proyectos" title="Cargar Excel" subtitle="Carga, agrega o reemplaza archivos del proyecto." />
      <ProyectoCargaForm proyectoId={proyecto.id} proyectoNombre={proyecto.nombre} tiposExistentes={tiposExistentes} />
    </>
  );
}
