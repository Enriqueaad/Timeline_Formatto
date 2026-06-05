import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeader eyebrow="Terreno" title="Supervisores" />
      <TableSkeleton rows={6} cols={5} />
    </>
  );
}
