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
