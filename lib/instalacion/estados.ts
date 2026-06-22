import type { EstadoAvance } from "@prisma/client";

// Fuente única de verdad de los estados de avance (marcado rápido de terreno).
// Para agregar un estado nuevo: 1) añadir el valor al enum EstadoAvance en schema.prisma
// (prisma db push + generate), 2) añadir una entrada aquí. Nada más cambia.
export type EstadoConfig = {
  label: string;
  bgClass: string;
  textClass: string;
  orden: number; // peso para derivar el estado del depto (mayor "gana")
};

export const ESTADOS: Record<EstadoAvance, EstadoConfig> = {
  PENDIENTE:  { label: "Pendiente",  bgClass: "bg-formatto-linen",   textClass: "text-formatto-bark",     orden: 0 },
  EN_PROCESO: { label: "En proceso", bgClass: "bg-formatto-sand",    textClass: "text-formatto-umber",    orden: 1 },
  COMPLETADO: { label: "Completado", bgClass: "bg-formatto-grafito", textClass: "text-white",             orden: 2 },
  SIN_CANCHA: { label: "Sin cancha", bgClass: "bg-primary",          textClass: "text-primary-foreground", orden: 3 },
};

// Orden de los estados para selectores (según `orden`).
export const ESTADOS_LISTA = (Object.keys(ESTADOS) as EstadoAvance[]).sort(
  (a, b) => ESTADOS[a].orden - ESTADOS[b].orden
);

// Deriva el estado de un depto a partir de los estados de sus muebles:
// - sin muebles → PENDIENTE
// - todos COMPLETADO → COMPLETADO
// - si hay algún SIN_CANCHA → SIN_CANCHA (es el bloqueo más relevante)
// - si hay algún EN_PROCESO o mezcla → EN_PROCESO
// - todos PENDIENTE → PENDIENTE
export function derivarEstadoDepto(estados: EstadoAvance[]): EstadoAvance {
  if (estados.length === 0) return "PENDIENTE";
  if (estados.some((e) => e === "SIN_CANCHA")) return "SIN_CANCHA";
  if (estados.every((e) => e === "COMPLETADO")) return "COMPLETADO";
  if (estados.every((e) => e === "PENDIENTE")) return "PENDIENTE";
  return "EN_PROCESO";
}
