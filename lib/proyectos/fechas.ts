// Sugerencia de fin estimado a partir de la tasa de instalación.
// Cuenta días hábiles (Lunes a Viernes), consistente con el módulo de rutas.

// Devuelve la fecha (ISO YYYY-MM-DD) resultante de instalar `unidades` a `tasa`
// deptos/día hábil, comenzando en `fechaInicioISO`. null si faltan datos válidos.
export function finEstimadoSugerido(
  fechaInicioISO: string | null | undefined,
  unidades: number,
  tasa: number | null | undefined
): string | null {
  if (!fechaInicioISO || !tasa || tasa <= 0 || unidades <= 0) return null;

  const diasHabiles = Math.ceil(unidades / tasa);
  if (diasHabiles <= 0) return null;

  const date = new Date(`${fechaInicioISO}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  // El primer día hábil cuenta como día 1; avanzamos hasta completar diasHabiles.
  let contados = 0;
  // Si el inicio cae en fin de semana, saltamos al primer día hábil sin contar.
  while (esFinDeSemana(date)) date.setDate(date.getDate() + 1);
  while (true) {
    if (!esFinDeSemana(date)) {
      contados++;
      if (contados >= diasHabiles) break;
    }
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function esFinDeSemana(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}
