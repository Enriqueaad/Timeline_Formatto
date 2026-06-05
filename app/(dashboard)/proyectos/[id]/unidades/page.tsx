import Link from "next/link";
import type { EtapaInstalacion, Prisma } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EtapaBadge } from "@/components/ui/EtapaBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ActaConformidadBtn } from "@/components/reportes/ActaConformidadBtn";
import { prisma } from "@/lib/prisma";
import { ETAPAS, avance, etapaDominante, tipoFiltroToWhere } from "@/lib/instalacion/utils";

export const dynamic = "force-dynamic";

type SearchValue = string | string[] | undefined;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

function validEtapa(value?: string): EtapaInstalacion | undefined {
  return ETAPAS.includes(value as EtapaInstalacion) ? (value as EtapaInstalacion) : undefined;
}

type ProyectoUnidadRef = {
  piso: string;
  tipo: string | null;
};

type ItemUnidad = {
  etapa: EtapaInstalacion;
  sku: string | null;
  descripcion: string | null;
  cantidad: number;
};

type UnidadRow = {
  id: string;
  piso: string;
  dpto: string;
  torre: string | null;
  tipo: string | null;
  items: ItemUnidad[];
};

type UnidadActa = {
  piso: string;
  dpto: string;
  tipo: string | null;
  items: Array<{ sku: string | null; descripcion: string | null; cantidad: number }>;
};

export default async function ProyectoUnidadesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchValue>>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const piso = first(search.piso);
  const tipo = first(search.tipo);
  const etapa = validEtapa(first(search.etapa));

  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        unidades: {
          select: { piso: true, tipo: true },
          orderBy: [{ piso: "asc" }],
        },
      },
    });

    if (!proyecto) {
      return (
        <>
          <PageHeader eyebrow="Proyectos" title="Unidades" />
          <div className="bg-white border border-border p-6 text-formatto-umber">Proyecto no encontrado.</div>
        </>
      );
    }

    const where: Prisma.UnidadWhereInput = {
      proyectoId: id,
      ...(piso ? { piso } : {}),
      ...(etapa ? { items: { some: { etapa } } } : {}),
      ...tipoFiltroToWhere(tipo),
    };

    const unidades = await prisma.unidad.findMany({
      where,
      orderBy: [{ piso: "asc" }, { dpto: "asc" }],
      include: {
        items: { select: { etapa: true, sku: true, descripcion: true, cantidad: true } },
      },
    });

    const unidadesTyped = unidades as UnidadRow[];
    const proyectoUnidades = proyecto.unidades as ProyectoUnidadRef[];
    const allItems = unidadesTyped.flatMap((unidad: UnidadRow) => unidad.items);
    const completados = allItems.filter((item: ItemUnidad) => item.etapa === "ENTREGA_CONFORME").length;
    const avanceGeneral = avance(allItems);
    const pisos = Array.from(new Set(proyectoUnidades.map((unidad: ProyectoUnidadRef) => unidad.piso))).filter(Boolean);
    const unidadesCompletadas = unidadesTyped
      .map((unidad: UnidadRow) => ({
        piso: unidad.piso,
        dpto: unidad.dpto,
        tipo: unidad.tipo,
        items: unidad.items
          .filter((item: ItemUnidad) => item.etapa === "ENTREGA_CONFORME")
          .map((item: ItemUnidad) => ({ sku: item.sku, descripcion: item.descripcion, cantidad: item.cantidad })),
      }))
      .filter((unidad: UnidadActa) => unidad.items.length > 0);

    return (
      <>
        <PageHeader
          eyebrow={proyecto.nombre}
          title="Unidades"
          actions={
            <div className="flex items-center gap-2">
              {unidadesCompletadas.length > 0 && <ActaConformidadBtn proyecto={proyecto.nombre} unidades={unidadesCompletadas} />}
              <form className="flex items-center gap-2" action={`/proyectos/${id}/unidades`}>
                <select name="piso" defaultValue={piso ?? ""} className="bg-white border border-border text-formatto-grafito text-sm px-3 py-2 rounded-sm">
                  <option value="">Todos los pisos</option>
                  {pisos.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <select name="tipo" defaultValue={tipo ?? ""} className="bg-white border border-border text-formatto-grafito text-sm px-3 py-2 rounded-sm">
                  <option value="">Todos los tipos</option>
                  <option value="COCINA">Cocina</option>
                  <option value="CLOSET">Closet</option>
                  <option value="PIERNAS">Piernas</option>
                </select>
                <select name="etapa" defaultValue={etapa ?? ""} className="bg-white border border-border text-formatto-grafito text-sm px-3 py-2 rounded-sm">
                  <option value="">Todas las etapas</option>
                  {ETAPAS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <button type="submit" className="rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
                  Filtrar
                </button>
              </form>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard eyebrow="Total unidades" value={unidades.length} />
          <StatCard eyebrow="Items completados" value={`${completados} / ${allItems.length}`} />
          <StatCard eyebrow="% avance general" value={`${avanceGeneral}%`} valueColor={avanceGeneral === 100 ? "rojo" : "default"} />
        </div>

        {unidadesTyped.length === 0 ? (
          <div className="bg-white border border-border p-8 text-center">
            <p className="text-formatto-umber mb-4">Sin unidades cargadas para este filtro.</p>
            <Link href={`/proyectos/${id}/carga`} className="inline-flex rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
              Cargar Excel
            </Link>
          </div>
        ) : (
          <div className="border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Piso</TableHead>
                  <TableHead>Dpto</TableHead>
                  <TableHead>Torre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">N items</TableHead>
                  <TableHead className="text-right">Completados</TableHead>
                  <TableHead>Etapa dominante</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidadesTyped.map((unidad: UnidadRow) => {
                  const dominante = etapaDominante(unidad.items);
                  const done = unidad.items.filter((item: ItemUnidad) => item.etapa === "ENTREGA_CONFORME").length;
                  return (
                    <TableRow key={unidad.id}>
                      <TableCell>{unidad.piso}</TableCell>
                      <TableCell className="font-semibold text-formatto-grafito">{unidad.dpto}</TableCell>
                      <TableCell>{unidad.torre ?? "-"}</TableCell>
                      <TableCell>{unidad.tipo ?? "-"}</TableCell>
                      <TableCell className="text-right">{unidad.items.length}</TableCell>
                      <TableCell className="text-right">{done}</TableCell>
                      <TableCell><EtapaBadge etapa={dominante} /></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/proyectos/${id}/unidades/${unidad.id}`} className="text-formatto-grafito underline underline-offset-2">
                          Ver detalle
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Proyectos" title="Unidades" />
        <div className="bg-white border border-border p-6 text-formatto-umber">
          {error instanceof Error ? error.message : "No fue posible cargar unidades."}
        </div>
      </>
    );
  }
}
