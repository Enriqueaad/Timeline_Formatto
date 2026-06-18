// Extrae el código de ficha (Cxx) del nombre de archivo, p.ej.
// "C13_ MALETERO 1170x530x18 - TEXTIL BEIGE.xlsm" → "C13"
// "C01A_ ...xlsm" → "C01A". Devuelve null si no calza.
export function codigoDeNombreFicha(filename: string): string | null {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const m = base.match(/^(C\d{1,3}[A-Z]?)/i);
  return m ? m[1].toUpperCase() : null;
}

// Normaliza un código de ficha para comparar (trim + mayúsculas, sin espacios).
export function normalizarCodigoFicha(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase().replace(/\s+/g, "");
}
