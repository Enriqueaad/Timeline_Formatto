import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseAdminEnv() {
  return Boolean(hasSupabaseEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAnon() {
  if (!hasSupabaseEnv()) return null;
  if (!anonClient) {
    anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return anonClient;
}

export function getSupabaseAdmin() {
  if (!hasSupabaseAdminEnv()) return null;
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return adminClient;
}

export async function requireAdmin(request: Request) {
  const supabase = getSupabaseAnon();
  const admin = getSupabaseAdmin();
  if (!supabase || !admin) {
    return { ok: false as const, status: 503, error: "Supabase no esta configurado para escritura." };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false as const, status: 401, error: "Falta sesion admin." };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return { ok: false as const, status: 401, error: "Sesion invalida." };

  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(data.user.email.toLowerCase())) {
    return { ok: false as const, status: 403, error: "Usuario sin permiso admin." };
  }

  return { ok: true as const, admin, user: data.user };
}
