import { PageHeader } from "@/components/layout/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";

export default function AdminPage() {
  return (
    <>
      <PageHeader eyebrow="Sistema" title="Admin" />
      <ComingSoon fase="6" descripcion="Configuracion general, usuarios, permisos y parametros del sistema." />
    </>
  );
}
