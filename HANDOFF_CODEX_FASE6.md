# Handoff Codex — Fase 6: Reportes, Polish y Deploy

> **Generado por Claude Code (Arquitecto Líder)**
> Leer también `ESTADO_PROYECTO.md` antes de ejecutar.
> Esta es la fase final. Al completarla, la app está lista para producción.

---

## Contexto de esta fase

Fase de cierre: reportes PDF, polish visual (skeletons, error boundaries), seed de datos y deploy a Vercel.

El objetivo es dejar la app completamente funcional, con datos de ejemplo y publicada en producción.

---

## Archivos base — NO MODIFICAR

Todo lo creado en Fases 0–5. Excepción: sí se modifica:
- `app/(dashboard)/dashboard/page.tsx` — mejorar con gráfico multi-proyecto
- `app/globals.css` — solo para agregar estilos de skeleton si es necesario
- `prisma/schema.prisma` — SOLO si el seed require ajuste menor (consultar antes de tocar)

---

## Tareas de esta fase

### 1. Dashboard global — gráfico multi-proyecto (Recharts)

Mejorar `/dashboard` (ya existe) agregando:
- `DashboardCharts.tsx` (Client Component en `components/dashboard/`)
- Gráfico de barras: % avance por proyecto (datos de `AvanceObra` — último registro por proyecto)
- Gráfico de línea: costo mensual total de dotación en el tiempo (suma de `AsignacionPersonal.costoMensual` por mes)
- Datos pasados desde Server Component como props serializables (strings, numbers — no Date)

```typescript
// dashboard/page.tsx — agregar a los datos existentes:
const proyectosAvance = proyectos.map(p => ({
  nombre: p.nombre,
  avance: p.avances[p.avances.length - 1]?.porcentaje ?? 0
}))
```

### 2. Acta de Conformidad PDF

Nuevo archivo: `components/reportes/ActaConformidadBtn.tsx` (Client Component)

Botón que aparece en `/proyectos/[id]/unidades` cuando hay unidades con `etapa = ENTREGA_CONFORME`.

Props:
```typescript
{
  proyecto: string
  unidades: Array<{
    piso: string
    dpto: string
    tipo: string | null
    items: Array<{
      sku: string | null
      descripcion: string | null
      cantidad: number
    }>
  }>
}
```

Estructura del PDF:
```
┌─────────────────────────────────────────────────────┐
│  formatto                           [fecha actual]   │
│  ACTA DE ENTREGA Y CONFORMIDAD                       │
│  Proyecto: [nombre del proyecto]                     │
├─────────────────────────────────────────────────────┤
│  Unidad: Piso X — Dpto Y                             │
│  Tipo: [tipo]                                        │
│                                                      │
│  SKU         Descripción                  Cant       │
│  KCH-001     Módulo alto izquierda          2        │
│  ...                                                 │
├─────────────────────────────────────────────────────┤
│  Unidad: Piso X — Dpto Z                             │
│  ...                                                 │
├─────────────────────────────────────────────────────┤
│  Firma cliente: _________________                    │
│  Firma supervisor: _______________                   │
└─────────────────────────────────────────────────────┘
```

- Solo incluir unidades que tengan AL MENOS UN ítem en ENTREGA_CONFORME
- Generar blob + descargar `acta_${proyecto}_${fecha}.pdf`
- Usar `PDF_COLORS` (igual que `ExportarRutaBtn`)
- Dinamic import `@react-pdf/renderer` en el handler de click

**Agregar el botón en `/proyectos/[id]/unidades/page.tsx`:**
- Solo mostrar si hay unidades completadas (`completados > 0`)
- Pasar los datos necesarios desde el Server Component

### 3. Reporte de Dotación PDF

Nuevo archivo: `components/reportes/ReporteDotacionBtn.tsx` (Client Component)

Botón que aparece en `/dotacion/[proyectoId]`.

Props:
```typescript
{
  proyecto: string
  personal: Array<{
    nombre: string
    cargo: string
    tipo: "FORMATTO" | "SUBCONTRATO"
    fechaInicio: string
    costoMensual: number
    evaluacion: number | null
  }>
  costoTotal: number
  fecha: string  // string ISO, no Date
}
```

Estructura del PDF:
```
┌─────────────────────────────────────────────────────┐
│  formatto                           [fecha actual]   │
│  REPORTE DE DOTACIÓN                                 │
│  Proyecto: [nombre]                                  │
├─────────────────────────────────────────────────────┤
│  FORMATTO                                            │
│  Nombre            Cargo       Inicio    Costo/mes   │
│  Juan Pérez        Instalador  Ene 26    $850.000    │
│  ...                                                 │
├─────────────────────────────────────────────────────┤
│  SUBCONTRATO                                         │
│  ...                                                 │
├─────────────────────────────────────────────────────┤
│  Costo mensual total: $X.XXX.XXX                     │
└─────────────────────────────────────────────────────┘
```

- Agrupar personal por tipo (FORMATTO primero, SUBCONTRATO después)
- `costoMensual` en formato CLP `$X.XXX.XXX`

### 4. Loading Skeletons

Agregar `loading.tsx` en las rutas con más datos:

```
app/(dashboard)/proyectos/loading.tsx
app/(dashboard)/dotacion/loading.tsx
app/(dashboard)/unidades/loading.tsx
app/(dashboard)/supervisores/loading.tsx
```

Cada `loading.tsx` exporta un componente que usa `LoadingSkeleton` (ya existe en `components/ui/LoadingSkeleton.tsx`).

Patrón:
```typescript
// app/(dashboard)/proyectos/loading.tsx
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Loading() {
  return (
    <>
      <PageHeader eyebrow="Gestion" title="Proyectos" />
      <LoadingSkeleton rows={6} />
    </>
  );
}
```

### 5. Error Boundaries

Agregar `error.tsx` en las rutas principales:

```
app/(dashboard)/proyectos/error.tsx
app/(dashboard)/dotacion/error.tsx
app/(dashboard)/unidades/error.tsx
app/(dashboard)/supervisores/error.tsx
```

Patrón (DEBE SER Client Component — requerimiento de Next.js):
```typescript
"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-formatto-cream border border-formatto-sand p-8 text-center">
      <p className="text-formatto-grafito font-semibold mb-2">Ocurrió un error inesperado</p>
      <p className="text-formatto-umber text-sm mb-4">{error.message}</p>
      <Button type="button" onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
```

### 6. Seed de datos

Nuevo archivo: `prisma/seed.ts`

Crear datos realistas para demostrar la app. NO usar datos inventados genéricos.

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // 1. Usuario admin
  await prisma.user.upsert({
    where: { email: "admin@formatto.cl" },
    update: {},
    create: {
      email: "admin@formatto.cl",
      name: "Admin Formatto",
      passwordHash: await bcrypt.hash("formatto2026", 10),
      role: "ADMIN",
    },
  })

  // 2. 4 proyectos (tipología real: edificios habitacionales en Chile)
  const proyectos = await Promise.all([
    prisma.proyecto.upsert({
      where: { id: "seed-proy-1" },
      update: {},
      create: { id: "seed-proy-1", nombre: "Edificio Los Almendros", constructora: "Aconcagua", estado: "ACTIVO", torre: "Torre A" },
    }),
    prisma.proyecto.upsert({
      where: { id: "seed-proy-2" },
      update: {},
      create: { id: "seed-proy-2", nombre: "Condominio Mirador del Valle", constructora: "Socovesa", estado: "ACTIVO" },
    }),
    prisma.proyecto.upsert({
      where: { id: "seed-proy-3" },
      update: {},
      create: { id: "seed-proy-3", nombre: "Parque Central Ñuñoa", constructora: "Inmobiliaria Paz", estado: "ACTIVO" },
    }),
    prisma.proyecto.upsert({
      where: { id: "seed-proy-4" },
      update: {},
      create: { id: "seed-proy-4", nombre: "Conjunto Habitacional San Miguel", constructora: "Almagro", estado: "PAUSADO" },
    }),
  ])

  // 3. 6 personal
  const personal = await Promise.all([
    prisma.personal.upsert({
      where: { rut: "12.345.678-9" },
      update: {},
      create: { rut: "12.345.678-9", nombre: "Carlos", paterno: "Rojas", cargo: "Instalador Senior", tipoContrato: "INDEFINIDO", tipo: "FORMATTO", estado: "ACTIVO" },
    }),
    // ... (crear al menos 6 personas con nombres y RUTs chilenos verosímiles)
  ])

  // 4. 2 supervisores
  await prisma.supervisor.upsert({
    where: { rut: "15.678.901-2" },
    update: {},
    create: { nombre: "Marcelo Vega", rut: "15.678.901-2", email: "mvega@formatto.cl", telefono: "+56 9 8765 4321", activo: true },
  })

  console.log("Seed completado.")
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
```

Agregar en `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

O si hay problemas con ts-node:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

**El seed debe ser idempotente** — usar `upsert` en todos los modelos con IDs fijos (`id: "seed-*"`).

### 7. `.env.example`

Crear `/.env.example` en la raíz:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Prisma — Supabase Postgres
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
# En produccion:
# NEXTAUTH_URL=https://instalaciones.formatto.design
```

### 8. `/reportes` — página de acceso a reportes

Reemplazar el `ComingSoon` actual con una página real:

```
app/(dashboard)/reportes/page.tsx  — MODIFICAR
```

- `PageHeader` eyebrow="Análisis" title="Reportes"
- Cards de acceso a cada tipo de reporte:
  - "Actas de conformidad" → link a `/proyectos` (para ir a un proyecto y bajar acta)
  - "Reportes de dotación" → link a `/dotacion`
  - "Rutas de supervisores" → link a `/supervisores`
- No hace falta generar PDFs aquí — es un hub de navegación

---

## Deploy a Vercel

**Solo ejecutar si hay confirmación explícita del usuario.**

Pasos para preparar el deploy:
1. Verificar que `.env.example` está completo
2. Verificar que `npx next build` pasa sin errores
3. Agregar `vercel.json` si se necesita configuración especial

Configuración de entorno en Vercel:
- Las variables de `.env.example` deben existir en el dashboard de Vercel
- `NEXTAUTH_URL` debe apuntar al dominio de producción
- `NEXTAUTH_SECRET` debe ser un secret seguro diferente al de dev

No ejecutar `vercel deploy` ni `vercel --prod` sin confirmación explícita del usuario.

---

## Criterios de aceptación

Claude Code verificará todos antes de aprobar:

- [ ] `npx tsc --noEmit` → sin errores
- [ ] `npx next build` → exitoso
- [ ] `/dashboard` incluye gráfico de avance por proyecto
- [ ] `ActaConformidadBtn` aparece en `/proyectos/[id]/unidades` cuando hay ítems completados
- [ ] PDF acta de conformidad descarga correctamente (aunque sea con datos vacíos)
- [ ] `ReporteDotacionBtn` aparece en `/dotacion/[proyectoId]`
- [ ] PDF reporte dotación descarga correctamente
- [ ] `loading.tsx` existe en las 4 rutas principales
- [ ] `error.tsx` existe en las 4 rutas principales (Client Components)
- [ ] `prisma/seed.ts` existe y es idempotente (`upsert` con IDs fijos)
- [ ] `package.json` tiene configuración de seed
- [ ] `.env.example` existe con todas las variables documentadas
- [ ] `/reportes` reemplaza ComingSoon con página hub

---

## Notas técnicas

1. **Dashboard charts — datos serializables:**
   El Server Component no puede pasar `Date` a un Client Component.
   Convertir fechas a strings ISO o números antes de pasarlos como props.

2. **`ActaConformidadBtn` en Server Page:**
   La página `/proyectos/[id]/unidades` es un Server Component. Para agregar el botón
   sin convertir toda la página a Client, crear el componente como Client Component
   e importarlo normalmente — Next.js maneja el boundary automáticamente.

3. **Seed con `tsx`:**
   ```bash
   npm install --save-dev tsx
   ```
   Y en `package.json`:
   ```json
   "prisma": { "seed": "tsx prisma/seed.ts" }
   ```
   Ejecutar con: `npx prisma db seed`

4. **`loading.tsx` y `error.tsx` en App Router:**
   - `loading.tsx` se activa automáticamente durante la suspensión de Server Components
   - `error.tsx` captura errores no manejados en el sub-árbol (DEBE ser `"use client"`)
   - No necesitan ninguna configuración extra — solo crear el archivo en la carpeta correcta

5. **`/reportes` como hub:**
   No necesita datos de BD — solo links de navegación con cards visuales usando tokens Formatto.

---

## Formato de entrega obligatorio

```
✅ FASE 6 COMPLETADA: Reportes, Polish y Deploy
Archivos creados/modificados: [lista completa]
Tests: [pasando / fallando]
Deploy: [URL de Vercel o "pendiente confirmación"]
→ Listo para revisión final de Claude Code
```

---

*Esta es la fase final. Claude Code revisará contra todos los criterios.
El deploy a Vercel solo se ejecuta con confirmación explícita del usuario.*
