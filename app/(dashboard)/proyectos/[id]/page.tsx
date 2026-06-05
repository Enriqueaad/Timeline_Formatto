import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { EstadoProyectoBadge } from "@/components/proyectos/EstadoProyectoBadge";
import { ProyectoEditForm } from "@/components/proyectos/ProyectoEditForm";
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
  try {
    proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        archivos: { orderBy: { creadoEn: "desc" } },
        unidades: { include: { _count: { select: { items: true } } }, orderBy: [{ piso: "asc" }, { dpto: "asc" }] },
      },
    });
  } catch {
    proyecto = null;
  }

  if (!proyecto) notFound();

  const totalItems = proyecto.unidades.reduce((sum, unidad) => sum + unidad._count.items, 0);
  const porPiso = new Map<string, { unidades: number; items: number }>();
  for (const unidad of proyecto.unidades) {
    const current = porPiso.get(unidad.piso) ?? { unidades: 0, items: 0 };
    current.unidades += 1;
    current.items += unidad._count.items;
    porPiso.set(unidad.piso, current);
  }

  return (
    <>
      <PageHeader
        eyebrow="Proyectos"
        title={proyecto.nombre}
        subtitle="Detalle operativo del proyecto"
        actions={
          <>
            <Link href={`/proyectos/${proyecto.id}/unidades`} className="inline-flex rounded-sm bg-white text-formatto-grafito border border-border px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
              Ver unidades
            </Link>
            <Link href={`/proyectos/${proyecto.id}/carga`} className="inline-flex rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
              Cargar Excel
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
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
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-border p-6 text-sm text-formatto-umber space-y-3">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Informacion</p>
          <p><span className="font-semibold text-formatto-grafito">Constructora:</span> {proyecto.constructora ?? "-"}</p>
          <p><span className="font-semibold text-formatto-grafito">Torre:</span> {proyecto.torre ?? "-"}</p>
          <p><span className="font-semibold text-formatto-grafito">Fin estimado:</span> {formatDate(proyecto.finEstimado)}</p>
          <p><span className="font-semibold text-formatto-grafito">Fecha creacion:</span> {formatDate(proyecto.creadoEn)}</p>
          <p><span className="font-semibold text-formatto-grafito">Observacion:</span> {proyecto.observacion ?? "-"}</p>
        </div>
        <ProyectoEditForm proyecto={{
          id: proyecto.id,
          nombre: proyecto.nombre,
          constructora: proyecto.constructora,
          torre: proyecto.torre,
          finEstimado: dateInput(proyecto.finEstimado),
          observacion: proyecto.observacion,
          estado: proyecto.estado,
        }} />
      </div>

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
