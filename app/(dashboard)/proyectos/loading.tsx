import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeader eyebrow="Gestion" title="Proyectos" />
      <TableSkeleton rows={6} cols={5} />
    </>
  );
}
