# Handoff Codex — Fase 4: Dotación Avanzada

> **Generado por Claude Code (Arquitecto Líder)**
> Leer también `ESTADO_PROYECTO.md` antes de ejecutar.
> No avanzar a Fase 5 sin aprobación de Claude Code.

---

## Contexto de esta fase

La página `/dotacion` ya existe (Fase 1) y lee desde Supabase directo con datos reales.
Esta fase la expande radicalmente:

1. **CRUD de personal completo** — crear, editar, desvincular
2. **Evaluaciones 1-5** — migrar el sistema actual MB/B/R/M a escala numérica
3. **Mover personal entre proyectos** — historial de asignaciones
4. **Gantt de asignaciones** con Recharts (eje Y personas, eje X meses)
5. **Gráficos de costos y avance** con Recharts
6. **Registro de avance de obra** — % completado por quincena
7. **Timeline React con Recharts** — reimplementación del vanilla JS actual (`/legacy`)

---

## Archivos base — NO MODIFICAR

Todo lo listado en `ESTADO_PROYECTO.md` sección "Archivos Base", más:
- `app/(dashboard)/proyectos/**` (Fase 2)
- `lib/excel/**` (Fase 2)
- `components/excel/**` (Fase 2)
- `components/proyectos/**` (Fase 2)
- `app/api/excel/**` (Fase 2)
- `app/api/proyectos/**` (Fase 2)
- `lib/actions/instalacion.ts` (Fase 3)
- `lib/instalacion/utils.ts` (Fase 3)
- `components/instalacion/**` (Fase 3)
- `app/(dashboard)/unidades/**` (Fase 3)
- `app/(dashboard)/proyectos/[id]/unidades/**` (Fase 3)

---

## Schema Prisma relevante (ya existe — solo leer)

```prisma
model Personal {
  id           String   @id @default(cuid())
  nombre       String
  rut          String?  @unique
  cargo        String?
  tipoContrato TipoContrato @default(PLAZO_FIJO)
  fechaIngreso DateTime?
  activo       Boolean  @default(true)
  creadoEn     DateTime @default(now())
  asignaciones AsignacionPersonal[]
  evaluaciones Evaluacion[]
}

model AsignacionPersonal {
  id         String    @id @default(cuid())
  personalId String
  personal   Personal  @relation(...)
  proyectoId String
  proyecto   Proyecto  @relation(...)
  rol        String?
  fechaInicio DateTime
  fechaFin    DateTime?
  tipoContrato TipoContrato @default(FORMATTO)
  costoMensual Float?
  creadoEn   DateTime   @default(now())
}

model Evaluacion {
  id         String   @id @default(cuid())
  personalId String
  personal   Personal @relation(...)
  proyectoId String?
  nota       Int      // 1-5
  periodo    String   // "2026-Q1", "2026-05", etc.
  observacion String?
  creadoEn   DateTime @default(now())
}

model AvanceObra {
  id         String   @id @default(cuid())
  proyectoId String
  proyecto   Proyecto @relation(...)
  fecha      DateTime
  porcentaje Float
  unidadesCompletadas Int?
  observacion String?
  registradoPor String?
  creadoEn   DateTime @default(now())
}

enum TipoContrato {
  FORMATTO
  SUBCONTRATO
  PLAZO_FIJO
  INDEFINIDO
}
```

---

## Componentes existentes a reutilizar (NO recrear)

| Componente | Ruta | Uso en esta fase |
|-----------|------|-----------------|
| `EvaluacionBadge` | `components/ui/EvaluacionBadge.tsx` | Badge nota 1-5 |
| `PageHeader` | `components/layout/PageHeader.tsx` | Header de cada página |
| `Button` | `components/ui/Button.tsx` | Botones de acción |
| `StatCard` | `components/ui/StatCard.tsx` | KPIs en dotación |
| `FormField` | `components/ui/FormField.tsx` | Inputs en modales |
| `LoadingSkeleton` | `components/ui/LoadingSkeleton.tsx` | Estados de carga |

---

## Estructura de archivos a crear / modificar

```
lib/actions/
  personal.ts          Server Actions: crearPersonal, editarPersonal, desvincularPersonal
  asignacion.ts        Server Actions: crearAsignacion, moverPersonal
  evaluacion.ts        Server Actions: crearEvaluacion
  avance.ts            Server Actions: registrarAvance

components/dotacion/
  PersonalModal.tsx    Modal crear/editar personal (Client Component)
  EvaluarModal.tsx     Modal evaluar 1-5 + período + observación (Client Component)
  MoverPersonalModal.tsx Modal mover personal a proyecto destino (Client Component)
  AsignacionGantt.tsx  Gantt Recharts — asignaciones por persona (Client Component)
  CostoChart.tsx       Gráfico barras apiladas FORMATTO vs SUBCONTRATO (Client Component)
  AvanceChart.tsx      Gráfico línea avance de obra % en el tiempo (Client Component)
  AvanceModal.tsx      Modal registrar avance % (Client Component)

app/(dashboard)/
  dotacion/
    page.tsx           MODIFICAR: expandir con StatCards + tabla + botones acción
    [proyectoId]/
      page.tsx         CREAR: dotación por proyecto con Gantt + charts
  timeline/
    page.tsx           MODIFICAR: reemplazar placeholder con timeline Recharts
```

---

## Server Actions

### `lib/actions/personal.ts`

```typescript
"use server"

export async function crearPersonal(data: {
  nombre: string
  rut?: string
  cargo?: string
  tipoContrato: TipoContrato
  fechaIngreso?: string
}): Promise<{ ok: boolean; id?: string; error?: string }>

export async function editarPersonal(
  id: string,
  data: Partial<{ nombre: string; rut: string; cargo: string; tipoContrato: TipoContrato; fechaIngreso: string }>
): Promise<{ ok: boolean; error?: string }>

export async function desvincularPersonal(
  id: string
): Promise<{ ok: boolean; error?: string }>
// Solo poner activo=false, NO borrar de BD
```

### `lib/actions/asignacion.ts`

```typescript
"use server"

export async function crearAsignacion(data: {
  personalId: string
  proyectoId: string
  rol?: string
  fechaInicio: string
  costoMensual?: number
  tipoContrato: TipoContrato
}): Promise<{ ok: boolean; error?: string }>

export async function moverPersonal(data: {
  personalId: string
  proyectoOrigenId: string
  proyectoDestinoId: string
  fechaEfectiva: string
  costoMensual?: number
  tipoContrato: TipoContrato
}): Promise<{ ok: boolean; error?: string }>
// Cierra la asignación origen (pone fechaFin = fechaEfectiva)
// Crea nueva asignación en proyecto destino
// En $transaction para atomicidad
```

### `lib/actions/evaluacion.ts`

```typescript
"use server"

export async function crearEvaluacion(data: {
  personalId: string
  proyectoId?: string
  nota: number   // 1-5, validar rango
  periodo: string
  observacion?: string
}): Promise<{ ok: boolean; error?: string }>
```

### `lib/actions/avance.ts`

```typescript
"use server"

export async function registrarAvance(data: {
  proyectoId: string
  fecha: string
  porcentaje: number  // 0-100
  unidadesCompletadas?: number
  observacion?: string
  registradoPor?: string
}): Promise<{ ok: boolean; error?: string }>
```

Reglas generales:
- Siempre `prisma.$transaction` para escrituras multi-tabla
- Siempre `revalidatePath` al final de acción exitosa
- Siempre retornar `{ ok: false, error: "..." }` sin lanzar excepciones

---

## Páginas

### `/dotacion` — vista global (MODIFICAR la existente)

**IMPORTANTE:** La versión actual lee desde `getSupabaseAnon()` directo. Esta fase la migra a Prisma.
Si Prisma falla, mantener el try/catch y mostrar error sin romper.

- `PageHeader` eyebrow="Personal" title="Dotación"
  actions: botón "Nuevo personal" (abre `PersonalModal`)
- 3 StatCards: Total personal activo · Proyectos con personal · Costo mensual total
- Tabla:
  - Columnas: Nombre · RUT · Cargo · Tipo contrato · Proyecto actual · Última evaluación · Acciones
  - "Proyecto actual" = el proyecto con `fechaFin = null` en `AsignacionPersonal`
  - Acciones: "Evaluar" (abre `EvaluarModal`) · "Mover" (abre `MoverPersonalModal`) · "Editar"
  - Personal inactivo: fila en `opacity-50`, sin botones de acción
- Filas alternas bg-white / bg-formatto-linen

### `/dotacion/[proyectoId]` — dotación por proyecto (CREAR)

Server Component base + Client Components para gráficos.

- `PageHeader` eyebrow={proyecto.nombre} title="Dotación" actions={link volver}
- 3 StatCards: Personal activo · Costo FORMATTO · Costo SUBCONTRATO
- `AsignacionGantt` — Recharts Gantt horizontal
- `CostoChart` — Recharts barras apiladas mensuales
- `AvanceChart` — Recharts línea de % avance en el tiempo
  - Botón "Registrar avance" → abre `AvanceModal`
- Tabla de personal del proyecto:
  - Columnas: Nombre · Cargo · Tipo · Fecha inicio · Costo mensual · Evaluación · Acciones

---

## Componentes

### `AsignacionGantt.tsx` (Client Component)

Props:
```typescript
{
  asignaciones: Array<{
    nombre: string         // nombre del personal
    cargo?: string | null
    proyecto: string       // nombre del proyecto
    proyectoId: string
    fechaInicio: Date
    fechaFin: Date | null  // null = activo hoy
  }>
  rangoMeses?: number     // meses a mostrar, default 12
}
```

Implementación con Recharts `BarChart` horizontal:
- Eje Y: nombres de personal
- Eje X: meses (formato "Ene 26", "Feb 26", etc.)
- Barras: un segmento por asignación, coloreado por tipo (FORMATTO = grafito, SUBCONTRATO = bark)
- Tooltip con nombre, proyecto, fechas, costo mensual
- Colores: solo tokens Formatto

Si Recharts no está instalado: `npm install recharts`

### `CostoChart.tsx` (Client Component)

Props:
```typescript
{
  datos: Array<{
    mes: string     // "2026-01", "2026-02", etc.
    formatto: number
    subcontrato: number
  }>
}
```

Recharts `BarChart` apilado:
- Eje X: meses
- Eje Y: costo CLP (formato abreviado $XXXk)
- Stack: FORMATTO (grafito) + SUBCONTRATO (bark)
- Tooltip con valores formateados en CLP

### `AvanceChart.tsx` (Client Component)

Props:
```typescript
{
  datos: Array<{
    fecha: Date
    porcentaje: number
  }>
}
```

Recharts `LineChart`:
- Eje X: fechas (format "DD MMM")
- Eje Y: 0-100% con línea de referencia a 100%
- Línea color grafito, punto en cada registro
- Si porcentaje = 100: punto en rojo

### `PersonalModal.tsx` (Client Component)

Modal crear o editar personal.
Props: `{ personal?: PersonalRow; proyectoId?: string; onClose: () => void }`

Campos:
- Nombre (required)
- RUT (opcional, formato XX.XXX.XXX-X)
- Cargo (opcional)
- Tipo contrato (select: PLAZO_FIJO / INDEFINIDO)
- Fecha ingreso (date input, opcional)

Comportamiento:
- Si `personal` existe → editar (llama `editarPersonal`)
- Si no → crear (llama `crearPersonal`)
- Validar con React Hook Form + Zod
- Al éxito: cerrar modal (router.refresh o revalidatePath del Server Action)

### `EvaluarModal.tsx` (Client Component)

Props: `{ personalId: string; nombre: string; onClose: () => void }`

Campos:
- Nota (1-5, 5 botones visuales — el activo en grafito, los demás en sand)
- Período (input text: "2026-Q2", "2026-05", etc.)
- Observación (textarea, opcional)
- Proyecto (select opcional — lista de proyectos activos)

### `MoverPersonalModal.tsx` (Client Component)

Props: `{ personalId: string; nombre: string; proyectoOrigenId: string; onClose: () => void }`

Campos:
- Proyecto destino (select de proyectos activos, excluir origen)
- Fecha efectiva (date input, required)
- Costo mensual nuevo (number, opcional)
- Tipo contrato (select)

### `AvanceModal.tsx` (Client Component)

Props: `{ proyectoId: string; onClose: () => void }`

Campos:
- Fecha (date, default hoy)
- Porcentaje (number 0-100, slider o input)
- Unidades completadas (number, opcional)
- Observación (textarea, opcional)

---

## Timeline React — `/timeline`

Reemplazar el placeholder `ComingSoon` con un timeline Recharts funcional.

**IMPORTANTE:** El SPA legacy en `/legacy` NO se toca. Esta es la versión nueva en React.

Datos: leer desde Supabase directo (igual que `/dotacion` actual) O desde Prisma si la migración de datos lo permite. Usar try/catch en ambos casos.

### Componente `TimelineRecharts.tsx` (Client Component)

Estructura visual equivalente al vanilla JS actual:
- Eje X: quincenas del año (24 segmentos = 3 por mes × 8 meses, o configurable)
  - Q1 = 1-10, Q2 = 11-20, Q3 = 21-fin de mes
- Eje Y: obras/proyectos
- Barras horizontales: asignación de personal por quincena
  - Color FORMATTO vs SUBCONTRATO
- Tooltip: personal asignado, tipo, costo

Si la reimplementación completa del Gantt requiere más trabajo del previsto, es ACEPTABLE entregar un componente básico que muestre al menos:
- Lista de proyectos con personal asignado actualmente
- Columnas de meses (sin quincenas finas)
- Recharts BarChart horizontal

**No bloquear el build por esto** — si no está listo, mostrar `ComingSoon` con nota "En construcción — Fase 4".

---

## Reglas de diseño (obligatorias)

- Solo tokens `formatto-*` — sin colores hardcodeados
- Recharts: usar `fill` con variables de Tailwind extraídas a constantes:
  ```typescript
  const COLORS = {
    formatto: "#2B2B2B",    // grafito
    subcontrato: "#8C7355", // bark
    rojo: "#CE4620",
  }
  ```
- Modales: fondo `bg-white`, border `border-formatto-sand`, padding p-6
- Overlay del modal: `fixed inset-0 bg-formatto-grafito/50 flex items-center justify-center z-50`
- Botón de cerrar modal: "×" en esquina superior derecha, text-formatto-bark
- Inputs en modales: `FormField` component (ya existe)
- Grid nota 1-5: 5 botones cuadrados `w-10 h-10 text-sm font-bold border border-formatto-sand`
  - Activo: `bg-formatto-grafito text-white`
  - Inactivo: `bg-white text-formatto-grafito hover:bg-formatto-cream`

---

## Criterios de aceptación

Claude Code verificará todos antes de aprobar:

- [ ] `npx tsc --noEmit` → sin errores
- [ ] `npx next build` → exitoso
- [ ] `/dotacion` lista personal con proyecto actual y última evaluación
- [ ] Botón "Nuevo personal" abre modal y crea en BD
- [ ] Botón "Evaluar" abre modal y registra evaluación 1-5
- [ ] Botón "Mover" abre modal, cierra asignación origen y crea en destino (transacción)
- [ ] `/dotacion/[proyectoId]` muestra personal del proyecto con StatCards
- [ ] `AsignacionGantt` renderiza en `/dotacion/[proyectoId]` (aunque sea con datos vacíos)
- [ ] `CostoChart` renderiza barras FORMATTO vs SUBCONTRATO
- [ ] `AvanceChart` renderiza línea de progreso
- [ ] Modal "Registrar avance" guarda en BD y actualiza el chart
- [ ] `/timeline` muestra alguna visualización React (mínimo: tabla de asignaciones actuales)
- [ ] Todas las páginas con try/catch defensivo
- [ ] Sin colores hardcodeados

---

## Notas técnicas

1. **Recharts en Server Components:** No se puede importar directo en RSC.
   Envolver los charts en archivos `"use client"` separados. El Server Component
   los importa y les pasa los datos como props serializables (no Date objects — usar
   strings ISO o números para timestamps).

2. **Modales sin librería:** Implementar con estado local `useState<boolean>` +
   portal `createPortal` en `document.body`, o simplemente con `fixed` positioning
   sin portal (más simple, funciona para este caso).

3. **revalidatePath después de cada Server Action:**
   ```typescript
   revalidatePath("/dotacion")
   revalidatePath(`/dotacion/${proyectoId}`)
   ```

4. **Migración datos Supabase → Prisma:**
   El personal actual vive en la tabla Supabase `personal`. En esta fase,
   el `Personal` de Prisma es una entidad NUEVA paralela (no migrar datos ahora).
   La página `/dotacion` puede mostrar ambos mientras existe la transición,
   o simplemente leer de Prisma (vacío al inicio, se llena con "Nuevo personal").
   **Decisión: leer solo de Prisma en esta fase.** Si no hay datos, mostrar empty state.

5. **Gantt con Recharts:** El componente más complejo. Si falla el tipado de Recharts,
   se puede tipar con `as any` en los datos del chart (solo ahí, no en el resto).

6. **`EvaluacionBadge` ya acepta nota 1-5** — verificar props antes de crear nueva lógica.

---

## Formato de entrega obligatorio

```
✅ FASE 4 COMPLETADA: Dotación Avanzada
Archivos creados/modificados: [lista completa]
Tests: [pasando / fallando]
→ Listo para revisión de Claude Code
```

---

*Una vez entregado, Claude Code revisa contra los criterios de aceptación.
No iniciar Fase 5 sin aprobación explícita.*
