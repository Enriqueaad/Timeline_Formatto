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

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  if (body.action === "unlink") {
    if (!body.id) {
      return NextResponse.json({ error: "Trabajador obligatorio." }, { status: 400 });
    }

    const { data: current } = await auth.admin
      .from("personal")
      .select("id,obra_nombre")
      .eq("id", String(body.id))
      .maybeSingle();

    const fecha = body.fecha ? String(body.fecha) : new Date().toISOString().slice(0, 10);
    const { data, error } = await auth.admin
      .from("personal")
      .update({
        cant: 0,
        fin: fecha
      })
      .eq("id", String(body.id))
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const motivo = body.motivo ? String(body.motivo).trim() : null;
    await auth.admin.from("personal_movimientos").insert({
      personal_id: data.id,
      tipo: "desvinculacion",
      obra_origen: current?.obra_nombre || data.obra_nombre,
      obra_destino: null,
      fecha,
      motivo,
      admin_email: auth.user.email
    });
    return NextResponse.json({ data, motivo });
  }

  if (!body.id || !body.obra) {
    return NextResponse.json({ error: "Trabajador y obra destino son obligatorios." }, { status: 400 });
  }

  const { data: current } = await auth.admin
    .from("personal")
    .select("id,obra_nombre")
    .eq("id", String(body.id))
    .maybeSingle();

  const targetObra = String(body.obra).trim();
  const { data: obra, error: obraError } = await auth.admin
    .from("obras")
    .select("id,nombre,supervisor")
    .eq("nombre", targetObra)
    .maybeSingle();

  if (obraError) return NextResponse.json({ error: obraError.message }, { status: 400 });
  if (!obra) return NextResponse.json({ error: "La obra destino no existe." }, { status: 404 });

  const payload = {
    obra_id: obra.id,
    obra_nombre: obra.nombre,
    supervisor: body.supervisor ? String(body.supervisor).trim() : obra.supervisor,
    desde: body.desde ? String(body.desde) : null
  };

  const { data, error } = await auth.admin
    .from("personal")
    .update(payload)
    .eq("id", String(body.id))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auth.admin.from("personal_movimientos").insert({
    personal_id: data.id,
    tipo: "reasignacion",
    obra_origen: current?.obra_nombre || null,
    obra_destino: obra.nombre,
    fecha: payload.desde || new Date().toISOString().slice(0, 10),
    motivo: null,
    admin_email: auth.user.email
  });
  return NextResponse.json({ data });
}
