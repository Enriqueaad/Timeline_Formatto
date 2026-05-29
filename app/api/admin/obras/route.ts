import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  if (!body.nombre || !body.fin || !body.estado) {
    return NextResponse.json({ error: "Nombre, estado y fin son obligatorios." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("obras")
    .upsert(
      {
        nombre: String(body.nombre).trim(),
        supervisor: body.supervisor ? String(body.supervisor).trim() : null,
        estado: String(body.estado).trim(),
        fin: String(body.fin)
      },
      { onConflict: "nombre" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre");
  if (!nombre) return NextResponse.json({ error: "Falta nombre de obra." }, { status: 400 });

  const { error } = await auth.admin.from("obras").delete().eq("nombre", nombre);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
