"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { EtapaInstalacion } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { avanzarEtapa } from "@/lib/actions/instalacion";

type AvanzarEtapaBtnProps = {
  itemId: string;
  etapaActual: EtapaInstalacion;
  usuario: string;
  etapaRetorno?: EtapaInstalacion | null;
  onAvanzado?: () => void;
};

const NEXT_ETAPA: Partial<Record<EtapaInstalacion, EtapaInstalacion>> = {
  PEDIDO: "FABRICACION",
  FABRICACION: "DESPACHO",
  DESPACHO: "INSTALACION",
  INSTALACION: "ENTREGA_CONFORME",
  ATRASADO: "PEDIDO",
};

const ETAPA_LABELS: Record<EtapaInstalacion, string> = {
  PEDIDO: "Pedido",
  FABRICACION: "Fabricacion",
  DESPACHO: "Despacho",
  INSTALACION: "Instalacion",
  ENTREGA_CONFORME: "Entrega conforme",
  ATRASADO: "Atrasado",
  OBSERVACION: "Observacion",
};

function siguienteEtapa(etapa: EtapaInstalacion, etapaRetorno?: EtapaInstalacion | null) {
  if (etapa === "OBSERVACION") return etapaRetorno ?? "PEDIDO";
  return NEXT_ETAPA[etapa] ?? null;
}

function textoBoton(etapa: EtapaInstalacion, siguiente: EtapaInstalacion | null) {
  if (!siguiente) return "Completado";
  if (etapa === "ATRASADO") return "Retomar";
  if (etapa === "OBSERVACION") return "Resolver";
  return `-> ${ETAPA_LABELS[siguiente]}`;
}

export function AvanzarEtapaBtn({ itemId, etapaActual, usuario, etapaRetorno, onAvanzado }: AvanzarEtapaBtnProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticEtapa, setOptimisticEtapa] = useOptimistic(etapaActual);
  const siguiente = siguienteEtapa(optimisticEtapa, etapaRetorno);

  function avanzar(destino: EtapaInstalacion, nota?: string) {
    setError(null);
    startTransition(async () => {
      setOptimisticEtapa(destino);
      const result = await avanzarEtapa(itemId, destino, usuario, nota);
      if (!result.ok) setError(result.error ?? "No fue posible avanzar.");
      if (result.ok) onAvanzado?.();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!siguiente || isPending}
          loading={isPending}
          onClick={() => siguiente && avanzar(siguiente)}
        >
          {textoBoton(optimisticEtapa, siguiente)}
        </Button>
        {optimisticEtapa !== "ATRASADO" && optimisticEtapa !== "ENTREGA_CONFORME" && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => avanzar("ATRASADO", "Marcado como atrasado")}
          >
            Marcar atrasado
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-formatto-rojo">{error}</p>}
    </div>
  );
}
