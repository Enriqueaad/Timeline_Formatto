import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { EstadoProyectoBadge } from "@/components/proyectos/EstadoProyectoBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type ProyectoRow = {
  id: string;
  nombre: string;
  constructora: string | null;
  estado: "ACTIVO" | "PAUSADO" | "TERMINADO";
  finEstimado: Date | null;
  _count: { unidades: number };
};

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

async function getProyectos() {
  try {
    const proyectos = await prisma.proyecto.findMany({
      orderBy: { creadoEn: "desc" },
      include: { _count: { select: { unidades: true } } },
    });
    return { proyectos: proyectos as ProyectoRow[], error: null as string | null };
  } catch (error) {
    return { proyectos: [] as ProyectoRow[], error: error instanceof Error ? error.message : "No fue posible conectar con la base de datos." };
  }
}

export default async function ProyectosPage() {
  const { proyectos, error } = await getProyectos();

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Proyectos"
        actions={
          <Link href="/proyectos/new" className="inline-flex rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
            Nuevo proyecto
          </Link>
        }
      />

      {error && <div className="mb-4 bg-white border border-border p-4 text-sm text-formatto-umber">{error}</div>}

      {proyectos.length === 0 ? (
        <div className="bg-white border border-border p-8 text-center">
          <p className="text-xl font-light text-formatto-grafito mb-3">Aun no hay proyectos cargados.</p>
          <Link href="/proyectos/new" className="inline-flex rounded-sm bg-formatto-grafito text-white px-4 py-2 text-2xs font-semibold uppercase tracking-widest">
            Crear primer proyecto
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nombre</TableHead>
                <TableHead>Constructora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fin estimado</TableHead>
                <TableHead className="text-right">N unidades</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyectos.map((proyecto) => (
                <TableRow key={proyecto.id}>
                  <TableCell className="font-semibold text-formatto-grafito">
                    <Link href={`/proyectos/${proyecto.id}`} className="underline underline-offset-2">{proyecto.nombre}</Link>
                  </TableCell>
                  <TableCell>{proyecto.constructora ?? "-"}</TableCell>
                  <TableCell><EstadoProyectoBadge estado={proyecto.estado} /></TableCell>
                  <TableCell>{formatDate(proyecto.finEstimado)}</TableCell>
                  <TableCell className="text-right">{proyecto._count.unidades}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/proyectos/${proyecto.id}/carga`} className="text-formatto-grafito underline underline-offset-2">Cargar Excel</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
