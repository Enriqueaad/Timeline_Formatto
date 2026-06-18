import type { EtapaInstalacion, Prisma } from "@prisma/client";

export const ETAPAS: EtapaInstalacion[] = [
  "PEDIDO",
  "FABRICACION",
  "DESPACHO",
  "INSTALACION",
  "ENTREGA_CONFORME",
  "ATRASADO",
  "OBSERVACION",
];

export const FLUJO_PRINCIPAL: EtapaInstalacion[] = [
  "PEDIDO",
  "FABRICACION",
  "DESPACHO",
  "INSTALACION",
  "ENTREGA_CONFORME",
];

type ItemConEtapa = { etapa: EtapaInstalacion };

export function conteosPorEtapa(items: ItemConEtapa[]) {
  const counts = Object.fromEntries(ETAPAS.map((etapa) => [etapa, 0])) as Record<EtapaInstalacion, number>;
  for (const item of items) counts[item.etapa] += 1;
  return counts;
}

export function etapaDominante(items: ItemConEtapa[]): EtapaInstalacion {
  if (items.length === 0) return "PEDIDO";
  if (items.every((item) => item.etapa === "ENTREGA_CONFORME")) return "ENTREGA_CONFORME";
  if (items.some((item) => item.etapa === "ATRASADO")) return "ATRASADO";
  if (items.some((item) => item.etapa === "OBSERVACION")) return "OBSERVACION";

  const counts = conteosPorEtapa(items);
  return Object.entries(counts)
    .filter(([etapa]) => FLUJO_PRINCIPAL.includes(etapa as EtapaInstalacion))
    .sort((a, b) => b[1] - a[1])[0]?.[0] as EtapaInstalacion;
}

export function avance(items: ItemConEtapa[]) {
  if (items.length === 0) return 0;
  const completados = items.filter((item) => item.etapa === "ENTREGA_CONFORME").length;
  return Math.round((completados / items.length) * 100);
}

// Filtra unidades por el tipo de mueble de sus items (campo confiable tipoMueble).
// Una unidad puede tener items de varios tipos (cocina + closet + piernas), por eso
// se filtra por la presencia de items del tipo pedido, no por el campo unidad.tipo.
export function tipoFiltroToWhere(tipo?: string): Prisma.UnidadWhereInput {
  if (tipo === "COCINA") return { items: { some: { tipoMueble: "COCINA" } } };
  if (tipo === "CLOSET") return { items: { some: { tipoMueble: { in: ["CLOSET_INTERIOR", "QUINCALLERIA"] } } } };
  if (tipo === "PIERNAS") return { items: { some: { tipoMueble: "PIERNAS" } } };
  return {};
}
