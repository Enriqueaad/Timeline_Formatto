import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  const raw = fs.readFileSync(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return env;
}

const env = loadEnv();
const email = env.ADMIN_EMAILS?.split(",")[0]?.trim();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
}
if (!email) throw new Error("Falta ADMIN_EMAILS en .env.local");
if (!password) throw new Error("Falta ADMIN_BOOTSTRAP_PASSWORD en el entorno");

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const created = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { role: "admin" }
});

if (!created.error) {
  console.log(JSON.stringify({ ok: true, action: "created", email }));
  process.exit(0);
}

if (!/already|registered|exists|duplicate/i.test(created.error.message)) {
  throw new Error(created.error.message);
}

const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (users.error) throw new Error(users.error.message);

const existing = users.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
if (!existing) throw new Error("El usuario existe, pero no fue encontrado para actualizarlo.");

const updated = await supabase.auth.admin.updateUserById(existing.id, {
  password,
  email_confirm: true,
  user_metadata: { ...(existing.user_metadata || {}), role: "admin" }
});
if (updated.error) throw new Error(updated.error.message);

console.log(JSON.stringify({ ok: true, action: "updated", email }));
