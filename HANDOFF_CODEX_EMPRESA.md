# Handoff Codex Empresa - Timeline Formatto

Este documento resume el estado del proyecto para continuar el trabajo desde otra cuenta de Codex. No incluye claves, contrasenas ni tokens.

## Estado Actual

- App en produccion: https://formatto-instalaciones-blue.vercel.app/
- GitHub limpio: https://github.com/Enriqueaad/Timeline_Formatto
- Rama principal: `main`
- Vercel project: `formatto-instalaciones`
- Vercel team/scope: `enriqueaads-projects`
- Supabase project: `Formatto - Dotacion Instalaciones`
- Supabase ref: `pzpfgcdtjgavvzbutxoh`
- Supabase URL: `https://pzpfgcdtjgavvzbutxoh.supabase.co`

## Carpeta Local Importante

El repositorio limpio que se subio a GitHub quedo en:

```text
C:\Users\Enrique Arenas\Documents\ENRIQUE ARENAS\Documentos Enrique\Timeline_Formatto\_github_clean
```

La carpeta raiz `Timeline_Formatto` conserva archivos historicos, versiones estaticas, Excel local y materiales de trabajo. Para continuar desde Codex empresa, lo mas limpio es clonar directamente el repo:

```bash
git clone https://github.com/Enriqueaad/Timeline_Formatto.git
cd Timeline_Formatto
npm install
npm run build
```

## Cuentas y Conexiones Necesarias

Para continuar en otra cuenta de Codex, conectar o tener acceso a:

- GitHub: usuario/repositorio `Enriqueaad/Timeline_Formatto`
- Vercel: team `enriqueaads-projects`, proyecto `formatto-instalaciones`
- Supabase: proyecto ref `pzpfgcdtjgavvzbutxoh`

Importante: en la sesion anterior el conector `@vercel` estaba autenticado en una cuenta vieja (`heinrickes-projects`). En la cuenta empresa conviene reconectar Vercel directamente al team correcto `enriqueaads-projects`.

## Variables de Entorno

En local se deben crear en `.env.local`. En Vercel ya estan cargadas para Production y Development.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
```

No subir `.env.local` al repo. Ya esta ignorado por `.gitignore`.

Valores conocidos sin secreto:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase indicada arriba.
- `ADMIN_EMAILS`: incluye `enrique.arenas@formatto.cl`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`: obtener desde Supabase/Vercel, no pegarlas en conversaciones ni commits.

## Stack Actual

- Next.js 16
- React 19
- Supabase JS
- Supabase Postgres
- Vercel deploy desde GitHub
- Importacion Excel por API admin
- Frontend basado en el timeline original HTML/CSS/JS

## Estructura Principal

```text
app/
  page.tsx
  layout.tsx
  globals.css
  api/
    timeline-data/
    auth/login/
    admin/
      obras/
      personal/
      subcontratos/
      excel-preview/

assets/
  css/timeline.css
  js/app.js
  js/data.js

public/
  assets/css/timeline.css
  assets/js/app.js
  assets/js/data.js

lib/
  supabase.ts
  timeline-db.ts
  static-data.ts

scripts/
  load-excel-to-supabase.mjs
  create-supabase-admin-user.mjs
  prepare-vercel-deploy.ps1

supabase/
  schema.sql
  seed-from-current-data.sql
```

Nota: `public/assets/...` es lo que sirve el navegador. `assets/js/data.js` se mantiene como fallback server-side para data estatica.

## Supabase

Tablas creadas:

- `obras`
- `personal`
- `subcontratos`
- `configuracion`

Datos cargados inicialmente desde Excel:

- 16 obras
- 45 registros de personal
- 9 subcontratos
- fecha de corte: `2026-05-27`

Casos criticos ya considerados:

- Obra solo subcontrato.
- Obra mixta Formatto + subcontrato.
- Vista Aguila como subcontrato activo.
- Filtros por estado/capas.
- Colores con contraste entre costo y dotacion.
- Etiquetas legibles.
- Marcadores `HOY` y `FIN`.
- Modal con click izquierdo.
- Tooltip/recuadro informativo con click derecho.

## Excel

Excel no queda conectado en vivo. La logica definida fue importacion manual:

1. Admin sube archivo.
2. App valida columnas/fechas.
3. App muestra preview.
4. Admin confirma antes de escribir en Supabase.

Archivo local usado para carga inicial:

```text
Base_Excel/DOTACION DE PERSONAL 27-05.xlsx
```

Pestana usada:

```text
TABLA CLAUDE
```

La carpeta `Base_Excel/` esta ignorada y no debe subirse a GitHub.

## Vercel

El proyecto correcto es:

```text
enriqueaads-projects/formatto-instalaciones
```

El repo GitHub quedo conectado al proyecto Vercel. Flujo actual:

```text
push a main -> Vercel build -> deploy production
```

URL estable:

```text
https://formatto-instalaciones-blue.vercel.app/
```

Se verifico que el alias apunta a un deployment `Ready` y que el HTML publicado contiene el SVG oficial del logo Formatto.

## Git

Repo limpio:

```text
https://github.com/Enriqueaad/Timeline_Formatto
```

Commits relevantes:

```text
c3f9113 Initial Formatto timeline app
c782226 Ignore local Vercel metadata
```

El remoto viejo `Heinrickes/Timeline_Formatto` no se debe usar para continuar.

## Logo

El logo en `app/page.tsx` fue reemplazado por el SVG exacto del archivo HTML original. Verificar que se mantenga:

```text
className="logo-svg"
viewBox="0 0 1445.1 236.12"
```

## Comandos Utiles

Instalar dependencias:

```bash
npm install
```

Desarrollo local:

```bash
npm run dev
```

Build local:

```bash
npm run build
```

Preparar carpeta limpia para deploy manual, si alguna vez se necesita:

```bash
npm run prepare:vercel
```

Deploy manual desde `_deploy_clean`, solo si falla GitHub/Vercel:

```bash
cd _deploy_clean
npx vercel deploy --prod --scope enriqueaads-projects
```

## Pendientes Recomendados

1. Confirmar que Codex empresa tenga acceso a GitHub, Vercel y Supabase.
2. Clonar repo limpio desde GitHub en un workspace nuevo.
3. Cargar `.env.local` localmente desde Vercel/Supabase.
4. Ejecutar `npm install` y `npm run build`.
5. Revisar visualmente produccion y local.
6. Continuar con CRUD admin:
   - editar obras
   - editar personal
   - editar subcontratos
   - actualizar estados/fechas/costos
   - importar Excel con preview
7. Agregar pruebas o checklist de regresion para:
   - subcontratos
   - proyectos mixtos
   - filtros
   - contraste/labels
   - `HOY` y `FIN`

## Informacion Que Debes Tener a Mano

Para continuar sin bloqueo en la cuenta empresa:

- Acceso GitHub al repo `Enriqueaad/Timeline_Formatto`.
- Acceso Vercel al team `enriqueaads-projects`.
- Acceso Supabase al proyecto `pzpfgcdtjgavvzbutxoh`.
- Valores de entorno desde Supabase/Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAILS`
- Password/admin login de la app, conocido por el propietario, no documentado aqui.
- Excel fuente si se requiere volver a importar datos.

