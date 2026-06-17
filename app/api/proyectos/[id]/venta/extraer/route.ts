import { NextResponse } from "next/server";
import { parseCotizacionPdf } from "@/lib/venta/cotizacion-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Extrae los datos del PDF de cotización SIN guardar. El usuario revisa y luego guarda.
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("pdf");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el PDF." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await parseCotizacionPdf(buffer);
    if (data.lineas.length === 0) {
      return NextResponse.json({ error: "No se detectaron líneas de precio en el PDF. Revisa el formato o ingrésalas manualmente." }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible leer el PDF." },
      { status: 400 }
    );
  }
}
