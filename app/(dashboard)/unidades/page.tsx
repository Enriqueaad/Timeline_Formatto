import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { avance } from "@/lib/instalacion/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

async function getProyectos() {
  try {
    const proyectos = await prisma.proyecto.findMany({
      orderBy: { nombre: "asc" },
      include: {
        unidades: {
          include: {
            items: { select: { etapa: true } },
          },
        },
      },
    });
    return { proyectos, error: null as string | null };
  } catch (error) {
    return {
      proyectos: [],
      error: error instanceof Error ? error.message : "No fue posible conectar con la base de datos.",
    };
  }
}

export default async function UnidadesPage() {
  const { proyectos, error } = await getProyectos();

  return (
    <>
      <PageHeader eyebrow="Gestion" title="Unidades" />

      {error && (
        <div className="mb-4 bg-white border border-border p-4 text-sm text-muted-foreground">
          {error}
        </div>
      )}

      <div className="border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Proyecto</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Items completados</TableHead>
              <TableHead>Avance</TableHead>
              <TableHead className="text-right">Accion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proyectos.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                  Sin proyectos o unidades para mostrar.
                </TableCell>
              </TableRow>
            ) : proyectos.map((proyecto) => {
              const items = proyecto.unidades.flatMap((unidad) => unidad.items);
              const completados = items.filter((item) => item.etapa === "ENTREGA_CONFORME").length;
              const porcentaje = avance(items);
              return (
                <TableRow key={proyecto.id}>
                  <TableCell className="font-semibold text-formatto-grafito">{proyecto.nombre}</TableCell>
                  <TableCell className="text-right">{proyecto.unidades.length}</TableCell>
                  <TableCell className="text-right">{completados} / {items.length}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-1 bg-border rounded-none overflow-hidden flex-1">
                        <div
                          className={`h-1 rounded-none ${porcentaje === 100 ? "bg-primary" : "bg-formatto-grafito"}`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <span className="text-2xs font-semibold text-formatto-grafito w-8 text-right">{porcentaje}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/proyectos/${proyecto.id}/unidades`} className="text-formatto-grafito underline underline-offset-2">
                      Ver unidades
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
