import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { EstadoProyectoBadge } from "@/components/proyectos/EstadoProyectoBadge";
import { ProyectoEditForm } from "@/components/proyectos/ProyectoEditForm";
import { DefinicionesForm } from "@/components/proyectos/DefinicionesForm";
import { EtapasProyecto, type EtapaProyecto } from "@/components/proyectos/EtapasProyecto";
import { EliminarProyectoBtn } from "@/components/proyectos/EliminarProyectoBtn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

function dateInput(value: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export default async function ProyectoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let proyecto;
  let supervisores: { id: string; nombre: string }[] = [];
  try {
    [proyecto, supervisores] = await Promise.all([
      prisma.proyecto.findUnique({
        where: { id },
        include: {
          archivos: { orderBy: { creadoEn: "desc" } },
          unidades: { include: { _count: { select: { items: true } } }, orderBy: [{ piso: "asc" }, { dpto: "asc" }] },
          asignacionesSupervisor: {
            where: { hasta: null },
            include: { supervisor: { select: { id: true, nombre: true } } },
          },
        },
      }),
      prisma.supervisor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    ]);
  } catch {
    proyecto = null;
  }

  if (!proyecto) notFound();

  const totalItems = proyecto.unidades.reduce((sum, unidad) => sum + unidad._count.items, 0);
  const porPiso = new Map<string, { unidades: number; items: number }>();
  const torresSet = new Set<string>();
  for (const unidad of proyecto.unidades) {
    const current = porPiso.get(unidad.piso) ?? { unidades: 0, items: 0 };
    current.unidades += 1;
    current.items += unidad._count.items;
    porPiso.set(unidad.piso, current);
    if (unidad.torre) torresSet.add(unidad.torre);
  }
  const torres = Array.from(torresSet).sort();

  // Supervisor responsable (asignación activa).
  const supervisorActivo = proyecto.asignacionesSupervisor[0]?.supervisor ?? null;

  // Estado de etapas (derivado de los datos).
  const tieneEstructura = proyecto.unidades.length > 0;
  const tieneDefiniciones = Boolean(
    proyecto.fechaInicio && proyecto.tasaInstalacion && proyecto.dotacionProyectada && supervisorActivo
  );

  const etapas: EtapaProyecto[] = [
    { n: 1, titulo: "Identidad", descripcion: "Nombre y constructora del proyecto.", completa: true },
    {
      n: 2,
      titulo: "Estructura",
      descripcion: tieneEstructura
        ? `${proyecto.unidades.length} unidades · ${totalItems} items cargados.`
        : "Carga el Excel con unidades, items y recetas.",
      completa: tieneEstructura,
      href: `/proyectos/${proyecto.id}/carga`,
      cta: tieneEstructura ? "Cargar más" : "Cargar Excel",
    },
    {
      n: 3,
      titulo: "Venta / Presupuesto",
      descripcion: "Precios de venta del proyecto (desde PDF).",
      completa: false,
      proximamente: true,
    },
    {
      n: 4,
      titulo: "Definiciones",
      descripcion: tieneDefiniciones
        ? "Fechas, tasa, dotación y supervisor definidos."
        : "Fechas, tasa de instalación, dotación y supervisor.",
      completa: tieneDefiniciones,
      href: "#definiciones",
      cta: "Completar",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Proyectos"
        title={proyecto.nombre}
        subtitle="Configuración y detalle del proyecto"
        actions={
          <>
            <Link href={`/proyectos/${proyecto.id}/unidades`} className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
              Ver unidades
            </Link>
            <Link href={`/proyectos/${proyecto.id}/carga`} className="inline-flex rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
              Cargar Excel
            </Link>
            <EliminarProyectoBtn proyectoId={proyecto.id} proyectoNombre={proyecto.nombre} unidades={proyecto.unidades.length} />
          </>
        }
      />

      {/* ── Tira de etapas ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <EtapasProyecto etapas={etapas} />
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-border p-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-2">Estado</p>
          <EstadoProyectoBadge estado={proyecto.estado} />
        </div>
        <div className="bg-white border border-border p-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-2">Unidades</p>
          <p className="text-4xl font-black text-formatto-grafito">{proyecto.unidades.length}</p>
        </div>
        <div className="bg-white border border-border p-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-2">Items</p>
          <p className="text-4xl font-black text-formatto-grafito">{totalItems}</p>
        </div>
        <div className="bg-white border border-border p-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-2">Torres</p>
          <p className="text-sm font-semibold text-formatto-grafito">
            {torres.length > 0 ? torres.join(", ") : <span className="text-formatto-bark font-normal">—</span>}
          </p>
        </div>
      </div>

      {/* ── Información + edición identidad ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-border p-6 text-sm text-formatto-umber space-y-3">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Información</p>
          <p><span className="font-semibold text-formatto-grafito">Constructora:</span> {proyecto.constructora ?? "-"}</p>
          <p><span className="font-semibold text-formatto-grafito">Supervisor responsable:</span> {supervisorActivo?.nombre ?? "Sin asignar"}</p>
          <p><span className="font-semibold text-formatto-grafito">Fecha inicio:</span> {formatDate(proyecto.fechaInicio)}</p>
          <p><span className="font-semibold text-formatto-grafito">Fin estimado:</span> {formatDate(proyecto.finEstimado)}</p>
          <p><span className="font-semibold text-formatto-grafito">Tasa instalación:</span> {proyecto.tasaInstalacion ? `${proyecto.tasaInstalacion} deptos/día` : "-"}</p>
          <p><span className="font-semibold text-formatto-grafito">Dotación proyectada:</span> {proyecto.dotacionProyectada ?? "-"}</p>
          <p><span className="font-semibold text-formatto-grafito">Fecha creación:</span> {formatDate(proyecto.creadoEn)}</p>
          <p><span className="font-semibold text-formatto-grafito">Observación:</span> {proyecto.observacion ?? "-"}</p>
        </div>
        <ProyectoEditForm proyecto={{
          id: proyecto.id,
          nombre: proyecto.nombre,
          constructora: proyecto.constructora,
          observacion: proyecto.observacion,
          estado: proyecto.estado,
        }} />
      </div>

      {/* ── Definiciones operativas (etapa 4) ──────────────────────────────── */}
      <div id="definiciones" className="mb-8">
        <DefinicionesForm
          proyecto={{
            id: proyecto.id,
            fechaInicio: dateInput(proyecto.fechaInicio),
            finEstimado: dateInput(proyecto.finEstimado),
            tasaInstalacion: proyecto.tasaInstalacion,
            dotacionProyectada: proyecto.dotacionProyectada,
          }}
          unidades={proyecto.unidades.length}
          supervisores={supervisores}
          supervisorActivoId={supervisorActivo?.id ?? null}
        />
      </div>

      {/* ── Detalle operativo ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border bg-white">
          <div className="border-b border-border p-4 text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Archivos cargados</div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Tipo</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyecto.archivos.length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="p-6 text-center text-formatto-bark">Sin archivos cargados.</TableCell></TableRow>
              ) : proyecto.archivos.map((archivo) => (
                <TableRow key={archivo.id}>
                  <TableCell>{archivo.tipo}</TableCell>
                  <TableCell>{archivo.nombreOriginal}</TableCell>
                  <TableCell>{formatDate(archivo.creadoEn)}</TableCell>
                  <TableCell className="text-right">{archivo.unidadesDetectadas}</TableCell>
                  <TableCell className="text-right">{archivo.filasLeidas}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border border-border bg-white">
          <div className="border-b border-border p-4 text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Resumen unidades por piso</div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Piso</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(porPiso.entries()).length === 0 ? (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={3} className="p-6 text-center text-formatto-bark">Sin unidades cargadas.</TableCell></TableRow>
              ) : Array.from(porPiso.entries()).map(([piso, data]) => (
                <TableRow key={piso}>
                  <TableCell className="font-semibold text-formatto-grafito">{piso}</TableCell>
                  <TableCell className="text-right">{data.unidades}</TableCell>
                  <TableCell className="text-right">{data.items}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
