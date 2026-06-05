import { PageHeader } from "@/components/layout/PageHeader";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeader eyebrow="Dotacion" title="Personal" />
      <TableSkeleton rows={6} cols={6} />
    </>
  );
}
