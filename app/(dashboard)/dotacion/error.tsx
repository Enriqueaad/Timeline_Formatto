"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white border border-border p-8 text-center">
      <p className="text-formatto-grafito font-semibold mb-2">Ocurrio un error inesperado</p>
      <p className="text-formatto-umber text-sm mb-4">{error.message}</p>
      <Button type="button" onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
