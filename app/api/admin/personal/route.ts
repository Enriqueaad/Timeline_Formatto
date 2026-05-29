import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  if (!body.obra || !body.nombre || !body.fin) {
    return NextResponse.json({ error: "Obra, nombre y fin son obligatorios." }, { status: 400 });
  }

  const { data: obra } = await auth.admin.from("obras").select("id").eq("nombre", body.obra).maybeSingle();
  const payload = {
    obra_id: obra?.id || null,
    obra_nombre: String(body.obra).trim(),
    nombre: String(body.nombre).trim(),
    cargo: body.cargo ? String(body.cargo).trim() : null,
    cant: Number(body.cant || 1),
    costo: Number(body.costo || 0),
    eval: String(body.eval || "B"),
    supervisor: body.supervisor ? String(body.supervisor).trim() : null,
    fin: String(body.fin),
    desde: body.desde ? String(body.desde) : null
  };

  const { data, error } = await auth.admin.from("personal").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
