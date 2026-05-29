import { NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = getSupabaseAnon();
  if (!supabase) return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 503 });

  const { email, password } = await request.json();
  if (!email || !password) return NextResponse.json({ error: "Email y password son obligatorios." }, { status: 400 });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });

  return NextResponse.json({
    accessToken: data.session?.access_token,
    user: { id: data.user?.id, email: data.user?.email }
  });
}
