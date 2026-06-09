import type { DiaSemana } from "@prisma/client";

export const DIAS_PLANIFICACION: DiaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

export const DIA_LABEL: Record<DiaSemana, string> = {
  LUNES:     "Lunes",
  MARTES:    "Martes",
  MIERCOLES: "Miércoles",
  JUEVES:    "Jueves",
  VIERNES:   "Viernes",
  SABADO:    "Sábado",
};

export const PERIODOS = ["MAÑANA", "MEDIO DÍA", "TARDE"] as const;
export type Periodo = (typeof PERIODOS)[number];
export const PERIODO_LABEL: Record<Periodo, string> = {
  "MAÑANA":    "Mañana",
  "MEDIO DÍA": "Medio día",
  "TARDE":     "Tarde",
};
export const PERIODO_ORDER: Record<string, number> = {
  "MAÑANA":    0,
  "MEDIO DÍA": 1,
  "TARDE":     2,
};

export const DIA_ABREV: Record<DiaSemana, string> = {
  LUNES:     "LUN",
  MARTES:    "MAR",
  MIERCOLES: "MIÉ",
  JUEVES:    "JUE",
  VIERNES:   "VIE",
  SABADO:    "SÁB",
};

export type ProyectoOption = {
  id: string;
  nombre: string;
};

export type ParadaPlan = {
  id?: string;
  tempId?: string;          // ID cliente para DnD (asignado en PlanificadorSemanal)
  proyectoId:    string;
  proyectoNombre: string;
  diaVisita:     DiaSemana;
  orden:         number;
  horaEstimada?: string | null;
  observacion?:  string | null;
  originalDia?:  DiaSemana; // día en la ruta guardada — para indicador de cambio
};
