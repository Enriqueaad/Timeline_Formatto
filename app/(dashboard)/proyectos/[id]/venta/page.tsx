import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { VentaForm, type VentaInicial } from "@/components/proyectos/VentaForm";

export const dynamic = "force-dynamic";

export default async function VentaProyectoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      cotizacion: { include: { lineas: { orderBy: { orden: "asc" } } } },
    },
  });

  if (!proyecto) notFound();

  const c = proyecto.cotizacion;
  const inicial: VentaInicial | null = c
    ? {
        fecha: c.fecha ? c.fecha.toISOString().slice(0, 10) : null,
        valorUF: c.valorUF,
        clienteContacto: c.clienteContacto,
        clienteCorreo: c.clienteCorreo,
        clienteTelefono: c.clienteTelefono,
        pdfUrl: c.pdfUrl,
        lineas: c.lineas.map((l) => ({
          categoria: l.categoria,
          tipologia: l.tipologia,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          valorUnitario: l.valorUnitario,
          valorUnitarioUF: l.valorUnitarioUF,
        })),
      }
    : null;

  return (
    <>
      <PageHeader
        eyebrow={proyecto.nombre}
        title="Venta / Presupuesto"
        subtitle="Precios de venta de la cotización del proyecto"
        actions={
          <Link href={`/proyectos/${proyecto.id}`} className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
            Volver al proyecto
          </Link>
        }
      />
      <VentaForm proyectoId={proyecto.id} inicial={inicial} />
    </>
  );
}
