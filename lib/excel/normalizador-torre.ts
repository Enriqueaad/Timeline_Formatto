// Normaliza el campo TORRE de un Excel según cuántas torres físicas confirmó el usuario.
//
// En algunos proyectos el campo TORRE del Excel trae códigos internos de diseño
// (ej. 0-9) que NO corresponden a torres físicas reales. El usuario confirma cuántas
// torres físicas tiene el proyecto:
//   - 1 torre  → todos los registros quedan con torre = null
//   - N torres → se conserva el valor raw como identificador de torre física
//
// `mapaSugerido` se ofrece para una UI futura de mapeo manual; por ahora, con N torres
// el valor raw se usa tal cual.
export type ResultadoNormalizacionTorre = {
  // Dado un valor raw del Excel, devuelve la torre normalizada a persistir.
  resolver: (valorRaw: string | null | undefined) => string | null;
  mapaSugerido: Record<string, string | null>;
};

export function normalizarTorre(
  valoresUnicos: string[],
  torresFisicas: number
): ResultadoNormalizacionTorre {
  const limpios = Array.from(new Set(valoresUnicos.map((v) => (v ?? "").trim()).filter(Boolean)));

  if (torresFisicas <= 1) {
    const mapaSugerido = Object.fromEntries(limpios.map((v) => [v, null]));
    return { resolver: () => null, mapaSugerido };
  }

  const mapaSugerido = Object.fromEntries(limpios.map((v) => [v, v]));
  return {
    resolver: (valorRaw) => {
      const v = (valorRaw ?? "").trim();
      return v.length > 0 ? v : null;
    },
    mapaSugerido,
  };
}
