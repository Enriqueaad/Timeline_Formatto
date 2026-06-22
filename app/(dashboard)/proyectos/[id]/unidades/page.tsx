import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { prisma } from "@/lib/prisma";
import { tipoFiltroToWhere } from "@/lib/instalacion/utils";
import { ESTADOS, ESTADOS_LISTA } from "@/lib/instalacion/estados";
import { UnidadesVista, type PisoGrupo } from "@/components/unidades/UnidadesVista";
import type { DeptoData } from "@/components/unidades/DeptoCard";
import type { EstadoAvance, Prisma, TipoMueble } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchValue = string | string[] | undefined;
function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}
function validEstado(value?: string): EstadoAvance | undefined {
  return value && value in ESTADOS ? (value as EstadoAvance) : undefined;
}

// Orden de tipos de mueble dentro de la tarjeta.
const ORDEN_TIPO: TipoMueble[] = ["COCINA", "CLOSET_INTERIOR", "PIERNAS", "QUINCALLERIA", "OTRO"];

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
  const estado = validEstado(first(search.estado));

  try {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      select: { id: true, nombre: true, unidades: { select: { piso: true }, orderBy: [{ piso: "asc" }] } },
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
      ...(estado ? { estado } : {}),
      ...tipoFiltroToWhere(tipo),
    };

    const unidades = await prisma.unidad.findMany({
      where,
      orderBy: [{ piso: "asc" }, { dpto: "asc" }],
      select: {
        id: true, piso: true, dpto: true, torre: true, tipo: true, estado: true, estadoManual: true,
        items: { select: { tipoMueble: true } },
        estadosMueble: { select: { tipoMueble: true, estado: true } },
      },
    });

    // Construir DeptoData (tipos presentes + su estado de mueble) y agrupar por piso.
    const pisosMap = new Map<string, DeptoData[]>();
    for (const u of unidades) {
      const estadoPorTipo = new Map(u.estadosMueble.map((e) => [e.tipoMueble, e.estado]));
      const tiposPresentes = Array.from(new Set(u.items.map((i) => i.tipoMueble)));
      const muebles = ORDEN_TIPO.filter((t) => tiposPresentes.includes(t)).map((t) => ({
        tipoMueble: t,
        estado: estadoPorTipo.get(t) ?? ("PENDIENTE" as EstadoAvance),
      }));
      const depto: DeptoData = {
        id: u.id, piso: u.piso, dpto: u.dpto, torre: u.torre, tipo: u.tipo,
        estado: u.estado, estadoManual: u.estadoManual, muebles,
      };
      pisosMap.set(u.piso, [...(pisosMap.get(u.piso) ?? []), depto]);
    }
    const pisos: PisoGrupo[] = Array.from(pisosMap.entries()).map(([p, deptos]) => ({ piso: p, deptos }));

    const totalDeptos = unidades.length;
    const completados = unidades.filter((u) => u.estado === "COMPLETADO").length;
    const avanceGeneral = totalDeptos > 0 ? Math.round((completados / totalDeptos) * 100) : 0;
    const pisosUnicos = Array.from(new Set(proyecto.unidades.map((u) => u.piso))).filter(Boolean);

    return (
      <>
        <PageHeader
          eyebrow={proyecto.nombre}
          title="Unidades"
          actions={
            <form className="flex items-center gap-2" action={`/proyectos/${id}/unidades`}>
              <select name="piso" defaultValue={piso ?? ""} className="bg-white border border-border text-formatto-grafito text-sm px-3 py-2 rounded-sm">
                <option value="">Todos los pisos</option>
                {pisosUnicos.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="tipo" defaultValue={tipo ?? ""} className="bg-white border border-border text-formatto-grafito text-sm px-3 py-2 rounded-sm">
                <option value="">Todos los tipos</option>
                <option value="COCINA">Cocina</option>
                <option value="CLOSET">Closet</option>
                <option value="PIERNAS">Piernas</option>
              </select>
              <select name="estado" defaultValue={estado ?? ""} className="bg-white border border-border text-formatto-grafito text-sm px-3 py-2 rounded-sm">
                <option value="">Todos los estados</option>
                {ESTADOS_LISTA.map((e) => <option key={e} value={e}>{ESTADOS[e].label}</option>)}
              </select>
              <button type="submit" className="rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">Filtrar</button>
            </form>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard eyebrow="Total deptos" value={totalDeptos} />
          <StatCard eyebrow="Completados" value={`${completados} / ${totalDeptos}`} />
          <StatCard eyebrow="% avance" value={`${avanceGeneral}%`} valueColor={avanceGeneral === 100 ? "rojo" : "default"} />
        </div>

        <UnidadesVista proyectoId={id} pisos={pisos} />
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
