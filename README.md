# Formatto Timeline CRUD

App Next.js para el timeline de dotacion Formatto, preparada para Supabase y Vercel.

## Desarrollo

```bash
npm install
npm run dev
```

## Supabase

1. Crea un proyecto Supabase.
2. Ejecuta `supabase/schema.sql` en el SQL editor.
3. Copia `.env.example` a `.env.local`.
4. Completa:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS`

Sin variables de Supabase, la app carga la data actual desde `assets/js/data.js` en modo demo.

## Vercel

Configura las mismas variables en Vercel Project Settings y despliega el repo.
