import Link from "next/link";
import { auth } from "@/auth";
import type { EtapaInstalacion } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { EtapaBadge } from "@/components/ui/EtapaBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PipelineVisual } from "@/components/instalacion/PipelineVisual";
import { AvanzarEtapaBtn } from "@/components/instalacion/AvanzarEtapaBtn";
import { HistorialEtapa } from "@/components/instalacion/HistorialEtapa";
import { prisma } from "@/lib/prisma";
import { FLUJO_PRINCIPAL, conteosPorEtapa } from "@/lib/instalacion/utils";

export const dynamic = "force-dynamic";

function formatCLP(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function grupoItem(subconjunto: string | null, tipo: string | null) {
  const value = (subconjunto ?? tipo ?? "SIN GRUPO").toUpperCase();
  if (value.includes("PIERNAS")) return "PIERNAS";
  if (value.includes("INTERIOR")) return "CLOSET INTERIOR";
  if (value.includes("QUINC")) return "QUINCALLERIA";
  if (tipo?.startsWith("CO_")) return "COCINA";
  return value;
}

function etapaRetorno(historial: { etapa: EtapaInstalacion; fecha: Date }[]) {
  return historial
    .filter((row) => FLUJO_PRINCIPAL.includes(row.etapa))
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0]?.etapa ?? "PEDIDO";
}

export default async function UnidadDetallePage({ params }: { params: Promise<{ id: string; uid: string }> }) {
  const { id, uid } = await params;
  const session = await auth();
  const usuario = session?.user?.email ?? "sistema";

  try {
    const unidad = await prisma.unidad.findUnique({
      where: { id: uid },
      include: {
        proyecto: { select: { id: true, nombre: true } },
        items: {
          orderBy: [{ subconjunto: "asc" }, { sku: "asc" }],
          include: {
            historial: { orderBy: { fecha: "desc" } },
          },
        },
      },
    });

    if (!unidad || unidad.proyectoId !== id) {
      return (
        <>
          <PageHeader eyebrow="Unidades" title="Detalle unidad" />
          <div className="bg-white border border-border p-6 text-formatto-umber">Unidad no encontrada.</div>
        </>
      );
    }

    const counts = conteosPorEtapa(unidad.items);
    const historial = unidad.items
      .flatMap((item) => item.historial.map((row) => ({
        id: row.id,
        etapa: row.etapa,
        fecha: row.fecha,
        usuario: row.usuario,
        nota: row.nota ? `${item.sku ?? item.descripcion ?? "Item"} · ${row.nota}` : item.sku ?? item.descripcion ?? null,
      })))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const grupos = new Map<string, typeof unidad.items>();
    for (const item of unidad.items) {
      const key = grupoItem(item.subconjunto, unidad.tipo);
      grupos.set(key, [...(grupos.get(key) ?? []), item]);
    }

    return (
      <>
        <PageHeader
          eyebrow={`${unidad.piso} - ${unidad.dpto}`}
          title={unidad.tipo ?? "Unidad"}
          subtitle={unidad.proyecto.nombre}
          actions={
            <Link href={`/proyectos/${id}/unidades`} className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
              Volver
            </Link>
          }
        />

        <div className="mb-8">
          <PipelineVisual conteosPorEtapa={counts} total={unidad.items.length} />
        </div>

        <div className="space-y-8 mb-8">
          {Array.from(grupos.entries()).map(([grupo, items]) => (
            <section key={grupo} className="border border-border bg-white">
              <div className="border-b border-border p-4 text-2xs font-semibold uppercase tracking-widest text-formatto-bark">
                - {grupo} ({items.length} items)
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>SKU</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Cant</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-formatto-grafito">{item.sku ?? "-"}</TableCell>
                      <TableCell>{item.descripcion ?? "-"}</TableCell>
                      <TableCell className="text-right">{item.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCLP(item.costo)}</TableCell>
                      <TableCell><EtapaBadge etapa={item.etapa} /></TableCell>
                      <TableCell className="text-right">
                          <AvanzarEtapaBtn
                            itemId={item.id}
                            etapaActual={item.etapa}
                            usuario={usuario}
                            etapaRetorno={etapaRetorno(item.historial)}
                          />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          ))}
        </div>

        <HistorialEtapa historial={historial} />
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Unidades" title="Detalle unidad" />
        <div className="bg-white border border-border p-6 text-formatto-umber">
          {error instanceof Error ? error.message : "No fue posible cargar la unidad."}
        </div>
      </>
    );
  }
}
