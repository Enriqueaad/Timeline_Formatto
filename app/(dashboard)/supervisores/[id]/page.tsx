import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}

function dateParam(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function SupervisorHistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supervisor = await prisma.supervisor.findUnique({
      where: { id },
      include: {
        rutas: {
          orderBy: { semana: "desc" },
          include: { paradas: true },
        },
      },
    });

    if (!supervisor) {
      return (
        <>
          <PageHeader eyebrow="Supervisores" title="Historial de rutas" />
          <div className="bg-white border border-border p-6 text-muted-foreground">Supervisor no encontrado.</div>
        </>
      );
    }

    return (
      <>
        <PageHeader
          eyebrow={supervisor.nombre}
          title="Historial de rutas"
          actions={
            <>
              <Button asChild variant="secondary" size="md">
                <Link href="/supervisores">Volver</Link>
              </Button>
              <Button asChild variant="primary" size="md">
                <Link href={`/supervisores/${supervisor.id}/ruta`}>Planificar semana</Link>
              </Button>
            </>
          }
        />

        <div className="border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Semana</TableHead>
                <TableHead className="text-right">Paradas</TableHead>
                <TableHead className="text-right">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisor.rutas.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="p-8 text-center text-muted-foreground">Sin rutas guardadas.</TableCell>
                </TableRow>
              ) : supervisor.rutas.map((ruta) => (
                <TableRow key={ruta.id}>
                  <TableCell className="font-semibold text-formatto-grafito">{formatDate(ruta.semana)}</TableCell>
                  <TableCell className="text-right">{ruta.paradas.length}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/supervisores/${supervisor.id}/ruta?semana=${dateParam(ruta.semana)}`} className="text-formatto-grafito underline underline-offset-2">
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  } catch (error) {
    return (
      <>
        <PageHeader eyebrow="Supervisores" title="Historial de rutas" />
        <div className="bg-white border border-border p-6 text-muted-foreground">
          {error instanceof Error ? error.message : "No fue posible cargar historial."}
        </div>
      </>
    );
  }
}
