import type { DiaSemana } from "@prisma/client";

export const DIAS_PLANIFICACION: DiaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];

export type ProyectoOption = {
  id: string;
  nombre: string;
};

export type ParadaPlan = {
  id?: string;
  proyectoId: string;
  proyectoNombre: string;
  diaVisita: DiaSemana;
  orden: number;
  horaEstimada?: string | null;
  observacion?: string | null;
};
