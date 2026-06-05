# Handoff Codex — Fase 1: Navegación y Estructura de Rutas

> **Generado por Claude Code (Arquitecto Líder)**
> Este documento es la instrucción oficial para que Codex ejecute la Fase 1.
> No avanzar a Fase 2 sin aprobación de Claude Code.

---

## Contexto del Proyecto

App interna Formatto para gestión de instalaciones de muebles en proyectos inmobiliarios.
Stack: Next.js (v16), React 19, TypeScript strict, Tailwind CSS v3, Prisma v7, NextAuth v5 beta,
Supabase PostgreSQL, bcryptjs.

---

## Arquitectura Base (NO MODIFICAR)

Claude Code dejó lista la base. No modificar estos archivos bajo ninguna circunstancia:

| Archivo | Propósito |
|---------|-----------|
| `auth.ts` | NextAuth config (Credentials + JWT + roles) |
| `middleware.ts` | Protección de rutas |
| `prisma/schema.prisma` | Schema completo |
| `prisma.config.ts` | Config Prisma 7 con datasource |
| `lib/prisma.ts` | Singleton PrismaClient con PrismaPg adapter |
| `tailwind.config.ts` | Tokens Formatto (NO agregar colores ni fuentes) |
| `components/layout/Sidebar.tsx` | Navegación principal |
| `components/layout/PageHeader.tsx` | Header de página |
| `components/layout/SessionProvider.tsx` | NextAuth provider |
| `components/ui/StatCard.tsx` | KPI card |
| `components/ui/EtapaBadge.tsx` | Badge pipeline |
| `components/ui/EvaluacionBadge.tsx` | Badge nota 1-5 |
| `components/ui/Button.tsx` | Botón con variantes |
| `components/ui/FormField.tsx` | Input, Select, Textarea, FieldWrap |
| `components/ui/LoadingSkeleton.tsx` | Skeletons |
| `app/(dashboard)/layout.tsx` | Layout protegido con Sidebar |
| `app/(dashboard)/dashboard/page.tsx` | Dashboard KPIs |
| `app/(dashboard)/timeline/page.tsx` | Placeholder timeline |
| `app/login/page.tsx` | Login page |
| `app/layout.tsx` | Root layout (Scripts legacy ya eliminados — NO tocar) |
| `app/legacy/layout.tsx` | Layout standalone legacy con scripts vanilla (NO tocar) |
| `app/globals.css` | CSS global con Tailwind + timeline legacy |

---

## Estado Actual de Rutas

| Ruta | Estado |
|------|--------|
| `/` | `app/page.tsx` — SPA legacy vanilla JS. Funciona. **NO tocar** |
| `/login` | ✅ Implementada |
| `/dashboard` | ✅ Implementada |
| `/timeline` | ✅ Placeholder implementado |
| `/proyectos` | ❌ No existe |
| `/unidades` | ❌ No existe |
| `/dotacion` | ❌ No existe |
| `/supervisores` | ❌ No existe |
| `/costos` | ❌ No existe |
| `/reportes` | ❌ No existe |
| `/rutas` | ❌ No existe |
| `/admin` | ❌ No existe |

---

## Fase 1 — Objetivo

Completar la estructura de navegación para que **todas las rutas del Sidebar tengan
una página funcional**. El usuario debe poder navegar por toda la app sin encontrar
errores 404. La funcionalidad completa de cada módulo viene en fases posteriores.

---

## Tareas Requeridas

### Tarea 1 — Redirect raíz

**Claude Code ya resolvió la contradicción del layout legacy:**
- `app/layout.tsx` — Scripts vanilla eliminados (ya no los carga globalmente)
- `app/legacy/layout.tsx` — Ya existe, carga los scripts vanilla. **NO tocar.**

Lo que Codex debe hacer:
- Mover `app/page.tsx` → `app/legacy/page.tsx` (solo mover el archivo)
- Crear `app/page.tsx` nuevo con un redirect a `/dashboard`:
  ```tsx
  import { redirect } from "next/navigation";
  export default function RootPage() { redirect("/dashboard"); }
  ```

### Tarea 2 — Página `/dotacion`

Ruta: `app/(dashboard)/dotacion/page.tsx`

- Server Component que lee personal de Supabase via `lib/supabase.ts` (ya existe).
  **NO usar Prisma** — la tabla `personal` de Supabase tiene:
  `id, nombre, cargo, obra_id, obra_nombre, cant, costo, eval, supervisor, fin`
- `PageHeader` eyebrow="Personal" title="Dotación"
- 4 StatCards: Total personal · Personal Formatto · Subcontrato · Costo total mes
- Tabla con columnas: Nombre · Cargo · Obra · Supervisor · Evaluación · Fin contrato
- Usar `EvaluacionBadge` para columna `eval` (mapear: MB→4, B→3, R→2, M→1)
- Filas alternas: `bg-white` / `bg-formatto-linen`
- Sin paginación por ahora (máx 100 registros)

### Tarea 3 — Página `/costos`

Ruta: `app/(dashboard)/costos/page.tsx`

- Server Component que lee personal de Supabase via `lib/supabase.ts`
- `PageHeader` eyebrow="Análisis" title="Costos de Dotación"
- 4 StatCards: Costo total mes · Personal Formatto · Subcontratos · Promedio por persona
- Tabla agrupada por obra: Obra · N° personas · Costo mensual · % del total
- Total general al pie de la tabla
- Usar el cliente Supabase existente

### Tarea 4 — Páginas placeholder (módulos futuros)

Crear con `PageHeader` + componente `ComingSoon`:

| Ruta | eyebrow | title |
|------|---------|-------|
| `app/(dashboard)/proyectos/page.tsx` | "Gestión" | "Proyectos" |
| `app/(dashboard)/unidades/page.tsx` | "Gestión" | "Unidades" |
| `app/(dashboard)/supervisores/page.tsx` | "Personal" | "Supervisores" |
| `app/(dashboard)/rutas/page.tsx` | "Planificación" | "Rutas de Visita" |
| `app/(dashboard)/reportes/page.tsx` | "Análisis" | "Reportes PDF" |
| `app/(dashboard)/admin/page.tsx` | "Sistema" | "Admin" |

Crear **un solo componente reutilizable** `ComingSoon`:
- Ruta: `components/ui/ComingSoon.tsx`
- Props: `fase: string, descripcion?: string`
- Diseño: card `bg-formatto-cream border border-formatto-sand p-6` con mensaje
  "— Módulo en desarrollo · Disponible en Fase {fase}"

---

## Reglas de Diseño (Obligatorias)

- **SOLO** clases Tailwind con tokens `formatto-*` (ej: `bg-formatto-cream`, `text-formatto-grafito`)
- `border-radius`: `rounded-sm` (2px) en inputs/badges · `rounded-none` en cards y contenedores
- **Tablas:**
  - Header: `bg-formatto-cream text-formatto-grafito font-semibold text-sm`
  - Filas alternas: `bg-white` / `bg-formatto-linen` · texto `text-formatto-umber`
  - Bordes: `border-formatto-sand`
- Sin sombras excepto `shadow-card`
- **Sin colores hardcodeados** — solo variables de `tailwind.config.ts`

---

## Criterios de Aceptación

Claude Code verificará que se cumplan **todos** antes de aprobar:

- [ ] `npx tsc --noEmit` sin errores
- [ ] `npx next build` sin errores
- [ ] `/` redirige a `/dashboard`
- [ ] `/legacy` carga la SPA legacy completa (Timeline, Home, Admin, etc.) sin errores JS
- [ ] `/dotacion` muestra tabla de personal con datos reales de Supabase
- [ ] `/costos` muestra tabla agrupada por obra con datos reales
- [ ] `/proyectos`, `/unidades`, `/supervisores`, `/rutas`, `/reportes`, `/admin` muestran `ComingSoon` sin errores 404
- [ ] El Sidebar muestra el ítem activo correcto en cada ruta
- [ ] Cerrar sesión desde el Sidebar redirige a `/login`

---

## Formato de Entrega Obligatorio

```
✅ FASE 1 COMPLETADA: Navegación y estructura de rutas
Archivos creados/modificados: [lista completa]
Tests: [pasando / fallando]
→ Listo para revisión de Claude Code
```

---

*Una vez entregado, Claude Code revisa contra los criterios de aceptación.
No iniciar Fase 2 hasta recibir aprobación explícita.*
