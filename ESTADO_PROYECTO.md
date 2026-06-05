# Estado del Proyecto — Formatto Gestión de Instalaciones

> **Documento vivo** — Se actualiza después de cada fase completada y revisada.
> Pasarlo siempre a Codex como contexto antes de ejecutar cualquier tarea.
> Claude Code es el único que marca fases como ✅ aprobadas.

---

## Resumen

| Campo | Valor |
|-------|-------|
| **Proyecto** | Formatto — Dashboard interno de gestión de instalaciones |
| **Repositorio** | `C:\Users\Enrique Arenas\Documents\Desarrollos - APP\Control de Instalaciones` |
| **URL producción** | https://formatto-instalaciones-blue.vercel.app |
| **Última actualización** | 2026-06-05 |
| **Fase actual** | FASE C completada — board rápido dotación ✅ |

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js v16, React 19, TypeScript strict |
| Estilos | Tailwind CSS v3 (tokens Formatto) + shadcn/ui |
| Componentes UI | shadcn/ui (manual install) + lucide-react |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Base de datos | Supabase PostgreSQL (pooler session, puerto 5432 en local) |
| Auth | NextAuth v5 beta (Credentials + JWT) |
| Gráficos | Recharts |
| Formularios | React Hook Form + Zod |
| Excel | xlsx (SheetJS) |
| PDF | @react-pdf/renderer |
| Fuente | Titillium Web (Google Fonts) |
| Color primario | `#D35132` (rojo brandbook oficial) |

---

## Decisiones de Arquitectura

| Decisión | Elección | Motivo |
|----------|----------|--------|
| UI base | shadcn/ui (manual) | Componentes accesibles con tokens Formatto |
| Color primario | `#D35132` | Brandbook oficial (antes `#CE4620`) |
| Sidebar | Blanco + iconos Lucide | Alineación con identidad web Formatto |
| Login | Split (imagen cocina izq + form der) | Referencia webs formatto.cl |
| Conexión BD local | Pooler session puerto 5432 | Puerto 6543 intermitente en red Formatto-Produc |
| SSL Prisma | `rejectUnauthorized: false` siempre | Supabase usa cert self-signed; antes solo en prod |
| Middleware | Cookie-based (no `auth()`) | Incompatibilidad Prisma con Edge runtime |
| Parseo Excel | Node runtime (SheetJS) | Evita carga en cliente |
| PDFs | `@react-pdf/renderer` cliente | Dynamic import, descarga directa |

---

## Archivos Base — NO MODIFICAR (escritos por Claude Code)

```
auth.ts                                → NextAuth config + roles
middleware.ts                          → Protección de rutas (cookie-based)
prisma/schema.prisma                   → Schema completo (sin url en datasource — va en prisma.config.ts)
prisma.config.ts                       → Config Prisma 7 con dotenv (.env + .env.local)
lib/prisma.ts                          → Singleton PrismaClient + PrismaPg + ssl rejectUnauthorized:false
lib/utils.ts                           → cn() helper (clsx + tailwind-merge)
tailwind.config.ts                     → Tokens Formatto + tokens shadcn (CSS vars)
app/globals.css                        → CSS vars shadcn mapeadas a colores Formatto
components.json                        → Config shadcn/ui
components/layout/Sidebar.tsx          → Sidebar blanco + iconos Lucide
components/layout/PageHeader.tsx       → Header con Punto de marca + línea inferior
components/layout/SessionProvider.tsx  → NextAuth provider
components/ui/StatCard.tsx             → KPI card (fondo blanco)
components/ui/EtapaBadge.tsx           → Badge pipeline (construido sobre Badge shadcn)
components/ui/EvaluacionBadge.tsx      → Badge nota 1-5 (construido sobre Badge shadcn)
components/ui/Button.tsx               → Botón CVA (shadcn-style, compatible con API legacy)
components/ui/FormField.tsx            → FieldWrap + Input + Select + Textarea (tokens shadcn)
components/ui/LoadingSkeleton.tsx      → Skeleton + TableSkeleton (sin beige)
components/ui/ComingSoon.tsx           → Placeholder módulos
components/ui/table.tsx                → Table/Header/Body/Row/Head/Cell shadcn (líneas finas)
components/ui/badge.tsx                → Badge CVA shadcn
components/ui/dialog.tsx               → Dialog shadcn (overlay, X icon, borde top primary)
components/ui/select.tsx               → Select shadcn (@radix-ui/react-select)
components/ui/textarea.tsx             → Textarea shadcn
components/ui/input.tsx                → Input shadcn
components/ui/label.tsx                → Label shadcn
components/ui/card.tsx                 → Card shadcn
components/ui/punto.tsx                → ▪ Cuadrito de marca Formatto
app/(dashboard)/layout.tsx             → Layout protegido con Sidebar
app/login/page.tsx                     → Login split (imagen cocina izq + form der)
app/layout.tsx                         → Root layout
```

---

## Moldes de referencia — Codex debe copiar estos patrones

| Patrón | Archivo molde |
|--------|--------------|
| Tabla shadcn (líneas finas, sin zebra) | `components/dotacion/DotacionTable.tsx` |
| Modal Dialog shadcn | `components/dotacion/PersonalModal.tsx` |
| Página completa (StatCards + tabla) | `app/(dashboard)/dotacion/page.tsx` |

---

## Plan por Fases

### ✅ Fases 0–5 — Funcionalidad Core
**Ejecutor:** Claude Code + Codex | **Estado:** Completadas y aprobadas

Todas las funcionalidades de negocio están implementadas:
proyectos, carga Excel, pipeline de instalación, dotación, supervisores, rutas de visita.
Ver detalle en `HANDOFF_CODEX_FASE1.md` → `HANDOFF_CODEX_FASE5.md`.

---

### ✅ Fase 6 — Reportes y Polish
**Ejecutor:** Codex | **Estado:** Completada y aprobada | **Fecha:** 2026-06-04

- [x] Dashboard global con DashboardCharts (BarChart avance + LineChart costos)
- [x] `ActaConformidadBtn` — PDF con ítems ENTREGA_CONFORME
- [x] `ReporteDotacionBtn` — PDF personal agrupado por tipo + costo total
- [x] `loading.tsx` en proyectos, dotacion, unidades, supervisores
- [x] `error.tsx` en proyectos, dotacion, unidades, supervisores
- [x] `prisma/seed.ts` completo (8 proyectos, 20 personal, 4 supervisores, rutas, avances, evaluaciones)
- [x] `.env.example` documentado
- [x] `.vercelignore`
- [x] `npx tsc --noEmit` → sin errores
- [x] `npm run build` → exitoso
- [x] Deploy → https://formatto-instalaciones-blue.vercel.app
- [x] Revisión y aprobación Claude Code

---

### ✅ Configuración de Entorno + Conexión BD
**Ejecutor:** Claude Code | **Estado:** Completada | **Fecha:** 2026-06-04

- [x] `.env.local` configurado con credenciales Supabase reales
- [x] `.env` con `DATABASE_URL` + `DIRECT_URL` para Prisma CLI
- [x] `prisma.config.ts` actualizado con `dotenv` cargado explícitamente
- [x] `lib/prisma.ts` — SSL `rejectUnauthorized: false` siempre (no solo en prod)
- [x] `DATABASE_URL` local apunta a session pooler puerto 5432 (6543 intermitente en red)
- [x] `npx prisma db push` exitoso
- [x] `npx ts-node prisma/seed.ts` — seed completo cargado en Supabase
- [x] Login funcionando con `enrique.arenas@formatto.cl` / `formatto2026`

> **Nota red:** La red `Formato-Produc` (WiFi oficina) bloquea o tiene comportamiento
> intermitente con el puerto 6543 (transaction pooler). Se usa el puerto 5432
> (session pooler) en local. En Vercel (producción) se usa el 6543 normal.

---

### ✅ FASE UI-1 — Fundación shadcn + Moldes de Referencia
**Ejecutor:** Claude Code | **Estado:** Completada y aprobada | **Fecha:** 2026-06-04
**Handoff para Codex:** `HANDOFF_CODEX_FASE_UI.md`

- [x] `npm install` shadcn deps: clsx, tailwind-merge, cva, tailwindcss-animate, lucide-react, @radix-ui/react-{slot,label,dropdown-menu,dialog,select}
- [x] `lib/utils.ts` — `cn()` helper
- [x] `components.json` — config shadcn
- [x] `tailwind.config.ts` — tokens semánticos shadcn + color primario `#D35132`
- [x] `app/globals.css` — CSS variables shadcn mapeadas a Formatto
- [x] Primitivos nuevos: `table`, `badge`, `dialog`, `select`, `textarea`, `input`, `label`, `card`, `punto`
- [x] Primitivos reestilizados (misma API): `StatCard`, `EtapaBadge`, `EvaluacionBadge`, `FormField`, `LoadingSkeleton`, `ComingSoon`, `PageHeader`
- [x] `Button.tsx` migrado a CVA (shadcn-style, retro-compatible con variantes legacy)
- [x] Sidebar → fondo blanco, iconos Lucide, logo oficial negro, acento naranja
- [x] Login → split (franja imagen cocina izq + form der con shadcn inputs + Punto)
- [x] Logo oficial `FORMATTO-punto.svg` → `public/formatto-logo.svg` + `public/formatto-logo-white.svg`
- [x] Título pestaña corregido ("Formatto — Gestión de Instalaciones")
- [x] Molde tabla: `DotacionTable.tsx` → `<Table>` líneas finas, sin zebra
- [x] Molde modal: `PersonalModal.tsx` → `Dialog` con borde top naranja
- [x] `npx tsc --noEmit` → sin errores
- [x] Revisado visualmente en browser: dotacion, sidebar, login, modales PersonalModal ✅

> **Pendiente usuario:** foto de cocina en `public/login-kitchen.jpg` (login izquierdo
> actualmente muestra fondo grafito como fallback).

---

### ✅ FASE UI-2 — Propagación del patrón (Codex)
**Ejecutor:** Codex | **Estado:** Completada y aprobada | **Fecha:** 2026-06-04
**Handoff:** `HANDOFF_CODEX_FASE_UI.md`

- [ ] Migrar tablas: `SupervisoresTable`, unidades page, unidad-detalle page, costos page
- [ ] Migrar modales: `EvaluarModal`, `MoverPersonalModal`, `AvanceModal`, `SupervisorModal`, modal inline `ProyectoCargaForm`
- [ ] Limpiar beige residual en páginas: dashboard, costos, dotacion/[id], proyectos/[id]/unidades, proyectos/[id]
- [ ] Actualizar colores Recharts: `DashboardCharts`, `CostoChart`, `AvanceChart`, `AsignacionGantt` → `#D35132`
- [ ] Verificar formularios: `ProyectoCreateForm`, `ProyectoEditForm`
- [ ] `npx tsc --noEmit` → sin errores
- [ ] `npm run build` → exitoso

---

### ✅ FASE UI-3 — Revisión y Polish Final (Claude Code)
**Ejecutor:** Claude Code | **Estado:** Completada y aprobada | **Fecha:** 2026-06-04

- [x] Revisión de los 18 archivos modificados por Codex
- [x] Fix `SupervisoresTable.tsx`: badge ACTIVO (grafito) / INACTIVO (secondary), links con Button asChild
- [x] Fix `app/(dashboard)/unidades/page.tsx`: reescritura completa → shadcn Table (era HTML nativo con beige)
- [x] Fix `app/(dashboard)/supervisores/[id]/page.tsx`: reescritura completa → shadcn Table + Button asChild
- [x] Fix `components/supervisores/PlanificadorSemanal.tsx`: selector semana + sidebar → bg-white border-border
- [x] Fix `components/supervisores/ParadaCard.tsx`: bg-white border-border
- [x] Fix `components/supervisores/DiaColumna.tsx`: border-border (sección + estado vacío)
- [x] Fix 4 × `error.tsx` (proyectos, dotacion, unidades, supervisores): bg-white border-border
- [x] Fix `app/(dashboard)/supervisores/[id]/ruta/page.tsx`: error divs → bg-white border-border
- [x] Fix `app/(dashboard)/supervisores/page.tsx`: error div → bg-white border-border
- [x] Fix `app/(dashboard)/timeline/page.tsx`: error div → bg-white border-border
- [x] Fix `components/instalacion/PipelineVisual.tsx`: beige → bg-white border-border
- [x] Fix `components/instalacion/HistorialEtapa.tsx`: border-formatto-sand → border-border
- [x] Fix `components/dotacion/TimelineRecharts.tsx`: beige → bg-white border-border
- [x] Fix `app/(dashboard)/reportes/page.tsx`: border-formatto-sand → border-border
- [x] Audit final grep: solo 4 beige intencionales restan (Button hover, EstadoProyectoBadge TERMINADO, ExcelPreview, DropZone)
- [x] `ESTADO_PROYECTO.md` actualizado

---

## Variables de Entorno

### `.env` (para Prisma CLI — no commitear)
```env
DATABASE_URL=postgresql://postgres.pzpfgcdtjgavvzbutxoh:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.pzpfgcdtjgavvzbutxoh:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
```

### `.env.local` (para Next.js en local — no commitear)
```env
DATABASE_URL=postgresql://postgres.pzpfgcdtjgavvzbutxoh:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.pzpfgcdtjgavvzbutxoh:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://pzpfgcdtjgavvzbutxoh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
AUTH_SECRET=[generado con openssl rand -base64 32]
NEXTAUTH_SECRET=[mismo valor que AUTH_SECRET]
NEXTAUTH_URL=http://localhost:3000
```

> **Nota seguridad:** La contraseña de BD fue expuesta en el chat en 2026-06-04.
> Pendiente rotarla en Supabase → Settings → Database → Reset password.

---

## Rutas de la App

| Ruta | Módulo | Estado |
|------|--------|--------|
| `/` | Redirect → `/dashboard` | ✅ |
| `/login` | Login split | ✅ |
| `/dashboard` | KPIs + gráficos | ✅ |
| `/proyectos` | Listado proyectos | ✅ |
| `/proyectos/[id]` | Detalle proyecto | ✅ |
| `/proyectos/[id]/carga` | Subir Excel | ✅ |
| `/proyectos/[id]/unidades` | Unidades del proyecto | ✅ |
| `/proyectos/[id]/unidades/[uid]` | Detalle unidad + pipeline | ✅ |
| `/unidades` | Vista global unidades | ✅ |
| `/dotacion` | Vista global dotación | ✅ |
| `/dotacion/[proyectoId]` | Dotación por proyecto | ✅ |
| `/supervisores` | Gestión supervisores | ✅ |
| `/supervisores/[id]` | Historial rutas supervisor | ✅ |
| `/supervisores/[id]/ruta` | Planificador semanal | ✅ |
| `/timeline` | Timeline Recharts | ✅ |
| `/costos` | Análisis de costos | ✅ |
| `/rutas` | Vista rutas | ✅ |
| `/reportes` | Hub reportes PDF | ✅ |
| `/admin` | Admin sistema | ✅ |
| `/legacy` | SPA legacy (Timeline vanilla) | ✅ |

---

## Credenciales de acceso (desarrollo)

| Campo | Valor |
|-------|-------|
| Email admin | `enrique.arenas@formatto.cl` |
| Contraseña | `formatto2026` |
| Email admin 2 | `admin@formatto.cl` |
| Contraseña | `formatto2026` |

---

## Historial de Revisiones

| Fecha | Fase | Acción | Por |
|-------|------|--------|-----|
| 2026-06-03 | Fases 0–5 | Completadas y aprobadas | Claude Code |
| 2026-06-03 | Fase 6 | Handoff generado | Claude Code |
| 2026-06-04 | Fase 6 | Completada por Codex — aprobada | Claude Code |
| 2026-06-04 | Entorno | BD conectada, seed cargado, login operativo | Claude Code |
| 2026-06-04 | FASE UI-1 | Fundación shadcn + moldes completados | Claude Code |
| 2026-06-04 | FASE UI-2 | Completada por Codex — aprobada | Claude Code |
| 2026-06-04 | FASE UI-3 | Revisión + barrido beige completo (15 archivos) — aprobada | Claude Code |
| 2026-06-05 | FASE A | Panel /rutas semanal con chips — completada | Claude Code |
| 2026-06-05 | FASE B | Asignación supervisor↔proyecto — completada | Claude Code |
| 2026-06-05 | FASE C | Board rápido dotación (vista tablero) — completada | Claude Code |
