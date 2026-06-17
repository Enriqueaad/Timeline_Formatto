import { extractText, getDocumentProxy } from "unpdf";

// Parser del PDF de cotización Formatto. Las páginas de detalle tienen un patrón
// consistente de dos líneas por ítem:
//   <TIPOLOGÍA> <CANTIDAD> <VALOR_UNIT>$ <TOTAL>$
//   <VALOR_UNIT_UF> <TOTAL_UF> UF
// La página 1 trae la cabecera comercial + valor UF + la línea de INSTALACIÓN.

export type CategoriaVentaParsed = "COCINA" | "CLOSET" | "ADICIONAL" | "INSTALACION" | "OTRO";

export type LineaCotizacionParsed = {
  categoria: CategoriaVentaParsed;
  tipologia: string | null;
  cantidad: number;
  valorUnitario: number;       // CLP
  valorUnitarioUF: number | null;
};

export type CotizacionParsed = {
  fecha: string | null;        // YYYY-MM-DD
  valorUF: number | null;
  clienteContacto: string | null;
  clienteCorreo: string | null;
  clienteTelefono: string | null;
  lineas: LineaCotizacionParsed[];
};

function numCLP(s: string): number {
  return parseInt(s.replace(/\./g, "").replace(/[^0-9]/g, ""), 10) || 0;
}
function numUF(s: string): number | null {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function categoriaDeTipologia(tip: string): CategoriaVentaParsed {
  const t = tip.toUpperCase();
  if (t.includes("ADICIONAL")) return "ADICIONAL";
  if (t.includes("INSTALAC")) return "INSTALACION";
  if (/^CO\b|^CO\d/.test(t)) return "COCINA";
  if (/^WCL|^CL\b|^CL\d/.test(t)) return "CLOSET";
  return "OTRO";
}

const ROW_RE = /^(.+?)\s+(\d+)\s+([\d.]+)\$\s+([\d.]+)\$\s*$/;
const UF_RE = /^([\d.,]+)\s+([\d.,]+)\s+UF\s*$/;

function parseHeader(texto: string): Omit<CotizacionParsed, "lineas"> {
  const fechaM = texto.match(/FECHA\s+(\d{2})-(\d{2})-(\d{4})/);
  const fecha = fechaM ? `${fechaM[3]}-${fechaM[2]}-${fechaM[1]}` : null;
  const contactoM = texto.match(/CONTACTO\s+(.+)/);
  const correoM = texto.match(/[\w.+-]+@[\w.-]+\.\w+/);
  const telM = texto.match(/TEL[ÉE]FONO\s+(.+)/);
  const ufM = texto.match(/([\d.]+)\s+MONTO EN UF/);
  return {
    fecha,
    valorUF: ufM ? numCLP(ufM[1]) : null,
    clienteContacto: contactoM ? contactoM[1].trim() : null,
    clienteCorreo: correoM ? correoM[0] : null,
    clienteTelefono: telM ? telM[1].trim() : null,
  };
}

function parseLineas(paginas: string[]): LineaCotizacionParsed[] {
  const lineas: LineaCotizacionParsed[] = [];

  // Detalle: pares de líneas (fila + UF) en todas las páginas.
  for (const pagina of paginas) {
    const filas = pagina.split(/\r?\n/).map((l) => l.trim());
    for (let i = 0; i < filas.length; i++) {
      const m = filas[i].match(ROW_RE);
      if (!m) continue;
      const tipologiaRaw = m[1].trim();
      // Excluir líneas de TOTAL ("150 TOTAL 84.581.795$" no calza por el $ final pero por si acaso)
      if (/^TOTAL\b/i.test(tipologiaRaw) || /\bTOTAL\b/i.test(tipologiaRaw)) continue;
      const categoria = categoriaDeTipologia(tipologiaRaw);
      const cantidad = parseInt(m[2], 10) || 0;
      const valorUnitario = numCLP(m[3]);

      let valorUnitarioUF: number | null = null;
      const next = filas[i + 1]?.match(UF_RE);
      if (next) valorUnitarioUF = numUF(next[1]);

      // Para ADICIONAL la "tipología" es descriptiva; la dejamos como tipología igual.
      lineas.push({
        categoria,
        tipologia: tipologiaRaw,
        cantidad,
        valorUnitario,
        valorUnitarioUF,
      });
    }
  }

  // Instalación (solo en el resumen de página 1): "INSTALACIÓN ... 760 UF" + "$" debajo.
  const resumen = paginas[0] ?? "";
  const instLineas = resumen.split(/\r?\n/).map((l) => l.trim());
  for (let i = 0; i < instLineas.length; i++) {
    if (/INSTALACI[ÓO]N/i.test(instLineas[i]) && /(\d[\d.]*)\s*UF/i.test(instLineas[i])) {
      const ufM = instLineas[i].match(/(\d[\d.]*)\s*UF/i);
      const montoM = (instLineas[i + 1] ?? "").match(/([\d.]+)\$/);
      if (montoM) {
        lineas.push({
          categoria: "INSTALACION",
          tipologia: "INSTALACIÓN",
          cantidad: 1,
          valorUnitario: numCLP(montoM[1]),
          valorUnitarioUF: ufM ? numUF(ufM[1]) : null,
        });
      }
      break;
    }
  }

  return lineas;
}

export async function parseCotizacionPdf(buffer: Buffer): Promise<CotizacionParsed> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  const paginas = Array.isArray(text) ? text : [text];
  const header = parseHeader(paginas.join("\n"));
  const lineas = parseLineas(paginas);
  return { ...header, lineas };
}
