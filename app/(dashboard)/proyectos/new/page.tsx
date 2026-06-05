import { PageHeader } from "@/components/layout/PageHeader";
import { ProyectoCreateForm } from "@/components/proyectos/ProyectoCreateForm";

export default function NewProyectoPage() {
  return (
    <>
      <PageHeader eyebrow="Gestion" title="Nuevo proyecto" subtitle="Crea el proyecto y carga un Excel inicial si corresponde." />
      <ProyectoCreateForm />
    </>
  );
}
