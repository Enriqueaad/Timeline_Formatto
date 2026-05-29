import { NextResponse } from "next/server";
import readXlsxFile from "read-excel-file/node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta archivo Excel." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = (await readXlsxFile(buffer) as unknown) as unknown[][];
  const headers = (rows[0] || []).map((cell) => String(cell || "").trim());
  const bodyRows = rows.slice(1);
  const sample = bodyRows.slice(0, 5).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header || `col_${index + 1}`, row[index] ?? ""]))
  );

  return NextResponse.json({
    file: file.name,
    sheets: [{ name: "Hoja 1", rows: bodyRows.length, columns: headers, sample }],
    message: "Vista previa lista. La escritura a Supabase se activa en el siguiente paso de importacion confirmada."
  });
}
