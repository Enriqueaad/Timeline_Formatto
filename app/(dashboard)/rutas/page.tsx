import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function RutasPage() {
  return (
    <>
      <PageHeader eyebrow="Planificacion" title="Rutas de Visita" />
      <ComingSoon fase="5" descripcion="Planificador semanal de visitas por supervisor y proyecto." />
    </>
  );
}
