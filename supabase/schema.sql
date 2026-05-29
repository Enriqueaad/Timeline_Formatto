create extension if not exists pgcrypto;

create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  supervisor text,
  estado text not null default 'PROCESO'
    check (estado in ('PROCESO','CIERRE','PILOTO','DESARROLLO','SUBCONTRATO')),
  fin date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id) on delete cascade,
  obra_nombre text,
  nombre text not null,
  cargo text,
  cant integer not null default 1 check (cant >= 0),
  costo integer not null default 0 check (costo >= 0),
  eval text not null default 'B' check (eval in ('MB','B','R','M')),
  supervisor text,
  fin date,
  desde date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subcontratos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id) on delete cascade,
  obra_nombre text not null,
  nombre text not null,
  cant integer not null default 0 check (cant >= 0),
  fin date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obra_nombre, nombre)
);

create table if not exists public.configuracion (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.configuracion(key, value)
values ('cutoffDate', '2026-05-27')
on conflict (key) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists personal_obra_id_idx on public.personal(obra_id);
create index if not exists subcontratos_obra_id_idx on public.subcontratos(obra_id);

drop trigger if exists obras_updated_at on public.obras;
create trigger obras_updated_at before update on public.obras
for each row execute function public.set_updated_at();

drop trigger if exists personal_updated_at on public.personal;
create trigger personal_updated_at before update on public.personal
for each row execute function public.set_updated_at();

drop trigger if exists subcontratos_updated_at on public.subcontratos;
create trigger subcontratos_updated_at before update on public.subcontratos
for each row execute function public.set_updated_at();

alter table public.obras enable row level security;
alter table public.personal enable row level security;
alter table public.subcontratos enable row level security;
alter table public.configuracion enable row level security;

drop policy if exists "authenticated read obras" on public.obras;
create policy "authenticated read obras" on public.obras
for select to authenticated using (true);

drop policy if exists "anon read obras" on public.obras;
create policy "anon read obras" on public.obras
for select to anon using (true);

drop policy if exists "authenticated read personal" on public.personal;
create policy "authenticated read personal" on public.personal
for select to authenticated using (true);

drop policy if exists "anon read personal" on public.personal;
create policy "anon read personal" on public.personal
for select to anon using (true);

drop policy if exists "authenticated read subcontratos" on public.subcontratos;
create policy "authenticated read subcontratos" on public.subcontratos
for select to authenticated using (true);

drop policy if exists "anon read subcontratos" on public.subcontratos;
create policy "anon read subcontratos" on public.subcontratos
for select to anon using (true);

drop policy if exists "authenticated read configuracion" on public.configuracion;
create policy "authenticated read configuracion" on public.configuracion
for select to authenticated using (true);

drop policy if exists "anon read configuracion" on public.configuracion;
create policy "anon read configuracion" on public.configuracion
for select to anon using (true);

-- Writes are performed by Next.js route handlers with SUPABASE_SERVICE_ROLE_KEY
-- after validating the logged-in user's email against ADMIN_EMAILS.
