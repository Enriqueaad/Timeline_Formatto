# Handoff Codex — Fase 5: Supervisores y Rutas de Visita

> **Generado por Claude Code (Arquitecto Líder)**
> Leer también `ESTADO_PROYECTO.md` antes de ejecutar.
> No avanzar a Fase 6 sin aprobación de Claude Code.

---

## Contexto de esta fase

Esta fase implementa dos módulos:

1. **Supervisores** — CRUD completo de supervisores de instalación
2. **Rutas de Visita** — Planificador semanal de visitas a obras:
   - Drag & drop de obras por día (Lunes–Viernes)
   - Guardar ruta en BD
   - Copiar semana anterior
   - Exportar PDF con header Formatto

Además, esta fase incluye un **fix de bug** de Fase 4 en `AsignacionGantt`.

---

## Archivos base — NO MODIFICAR

Todo lo listado en `ESTADO_PROYECTO.md` sección "Archivos Base", más todo lo creado en Fases 2, 3 y 4:
- `lib/excel/**`, `components/excel/**`, `app/api/excel/**`
- `lib/actions/instalacion.ts`, `lib/instalacion/utils.ts`, `components/instalacion/**`
- `lib/actions/personal.ts`, `lib/actions/asignacion.ts`, `lib/actions/evaluacion.ts`, `lib/actions/avance.ts`
- `components/dotacion/**` (EXCEPCIÓN: sí modificar `AsignacionGantt.tsx` para el fix)
- `app/(dashboard)/dotacion/**`, `app/(dashboard)/unidades/**`
- `app/(dashboard)/proyectos/**`

---

## Schema Prisma relevante (ya existe — solo leer)

```prisma
model Supervisor {
  id       String   @id @default(cuid())
  nombre   String
  rut      String?  @unique
  email    String?
  telefono String?
  activo   Boolean  @default(true)
  creadoEn DateTime @default(now())

  asignaciones AsignacionPersonal[]
  rutas        RutaVisita[]
}

model RutaVisita {
  id            String     @id @default(cuid())
  supervisorId  String
  supervisor    Supervisor @relation(...)
  semana        DateTime   // Lunes de la semana (fecha normalizada)
  creadoEn      DateTime   @default(now())
  actualizadoEn DateTime   @updatedAt
  paradas       ParadaRuta[]
}

model ParadaRuta {
  id           String     @id @default(cuid())
  rutaId       String
  ruta         RutaVisita @relation(...)
  proyectoId   String
  proyecto     Proyecto   @relation(...)
  orden        Int
  diaVisita    DiaSemana
  horaEstimada String?    // "09:30"
  observacion  String?
}

enum DiaSemana {
  LUNES MARTES MIERCOLES JUEVES VIERNES SABADO
}
```

---

## Fix requerido: `AsignacionGantt.tsx` (Fase 4 bug)

El `AsignacionGantt` actual calcula `fill` por fila pero no lo aplica porque `<Bar fill={...}>` es estático.

**Solución — agregar `Cell` de recharts:**

```typescript
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// ... mismo código, cambiar solo el Bar:
<Bar dataKey="meses">
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.fill} />
  ))}
</Bar>
```

Modificar únicamente esta sección de `components/dotacion/AsignacionGantt.tsx`.

---

## Estructura de archivos a crear / modificar

```
lib/actions/
  supervisor.ts           Server Actions: crearSupervisor, editarSupervisor, toggleActivo
  ruta.ts                 Server Actions: guardarRuta, copiarSemanaAnterior

components/supervisores/
  SupervisorModal.tsx     Modal crear/editar supervisor (Client Component)
  PlanificadorSemanal.tsx Drag & drop semanal 5 columnas (Client Component)
  DiaColumna.tsx          Columna de un día con sus paradas (Client Component)
  ParadaCard.tsx          Tarjeta arrastrable de una parada (Client Component)
  ExportarRutaBtn.tsx     Botón exportar PDF ruta semanal (Client Component)

app/(dashboard)/
  supervisores/
    page.tsx              Listado de supervisores con acciones
    [id]/
      page.tsx            Historial de rutas del supervisor
      ruta/
        page.tsx          Planificador semanal — semana activa
```

---

## Server Actions

### `lib/actions/supervisor.ts`

```typescript
"use server"

export async function crearSupervisor(data: {
  nombre: string
  rut?: string
  email?: string
  telefono?: string
}): Promise<{ ok: boolean; id?: string; error?: string }>

export async function editarSupervisor(
  id: string,
  data: Partial<{ nombre: string; rut: string; email: string; telefono: string }>
): Promise<{ ok: boolean; error?: string }>

export async function toggleActivo(
  id: string
): Promise<{ ok: boolean; error?: string }>
// Alterna activo: true ↔ false (NO borra)
```

### `lib/actions/ruta.ts`

```typescript
"use server"

// Guarda la ruta completa de una semana (upsert — crea si no existe, reemplaza paradas)
export async function guardarRuta(data: {
  supervisorId: string
  semana: string  // "2026-06-09" — siempre lunes
  paradas: Array<{
    proyectoId: string
    diaVisita: DiaSemana
    orden: number
    horaEstimada?: string
    observacion?: string
  }>
}): Promise<{ ok: boolean; rutaId?: string; error?: string }>

// Copia las paradas de la semana anterior a la semana actual
export async function copiarSemanaAnterior(data: {
  supervisorId: string
  semanaActual: string  // "2026-06-16" — lunes de semana destino
}): Promise<{ ok: boolean; error?: string }>
```

Reglas para `guardarRuta`:
- Buscar si ya existe `RutaVisita` para ese `supervisorId + semana`
- Si existe: borrar todas las `ParadaRuta` y recrearlas (no actualizar una a una)
- Si no existe: crear `RutaVisita` + `ParadaRuta` en `$transaction`
- `semana` debe normalizarse al lunes: recibir cualquier fecha de la semana, devolver el lunes

Reglas para `copiarSemanaAnterior`:
- Calcular `semana anterior = semanaActual - 7 días`
- Buscar `RutaVisita` de la semana anterior para ese supervisor
- Si no existe: `{ ok: false, error: "No hay ruta en la semana anterior." }`
- Si existe: copiar todas las `ParadaRuta` a la semana actual (mismos proyectos, días y horas)
- Si ya hay paradas en la semana actual: reemplazar (mismo comportamiento que guardarRuta)

---

## Páginas

### `/supervisores` — listado (reemplazar ComingSoon)

Server Component.

- `PageHeader` eyebrow="Personal" title="Supervisores"
  actions: botón "Nuevo supervisor" (abre `SupervisorModal`)
- Tabla:
  - Columnas: Nombre · RUT · Email · Teléfono · Estado · Rutas esta semana · Acciones
  - "Rutas esta semana" = count de paradas en la semana actual
  - Estado: badge "Activo" (`bg-formatto-grafito text-white`) / "Inactivo" (`bg-formatto-sand`)
  - Acciones: "Ver rutas" → `/supervisores/[id]` · "Planificar" → `/supervisores/[id]/ruta` · "Editar" · "Activar/Desactivar"
- Filas alternas bg-white / bg-formatto-linen
- Inactivo: `opacity-50`

### `/supervisores/[id]` — historial de rutas

Server Component.

- `PageHeader` eyebrow={supervisor.nombre} title="Historial de rutas"
  actions: link "Planificar semana" → `/supervisores/[id]/ruta` + link "Volver"
- Lista de semanas con rutas guardadas, ordenada de más reciente a más antigua
- Por cada semana: fecha de lunes (ej: "09 Jun 2026") · N° de paradas · link "Ver" → `/supervisores/[id]/ruta?semana=2026-06-09`
- Si sin rutas: empty state

### `/supervisores/[id]/ruta` — planificador semanal

Server Component con `PlanificadorSemanal` (Client Component).

Datos que el Server Component pasa al planificador:
- `supervisorId`, `nombre del supervisor`
- `semana` (del query param `?semana=YYYY-MM-DD` o semana actual si no hay param)
- `rutaActual?: { paradas: [...] }` — ruta guardada para esa semana si existe
- `proyectos` — lista de proyectos ACTIVOS para el selector

```tsx
<PlanificadorSemanal
  supervisorId={id}
  semana={semana}  // string "2026-06-09"
  rutaActual={ruta?.paradas ?? []}
  proyectos={proyectos}
/>
```

---

## Componentes

### `PlanificadorSemanal.tsx` (Client Component)

Es el núcleo de esta fase. Gestiona el estado local del plan y coordina las columnas.

Estado interno:
```typescript
type Parada = {
  id?: string          // si viene de BD
  proyectoId: string
  proyectoNombre: string
  diaVisita: DiaSemana
  orden: number
  horaEstimada?: string
  observacion?: string
}

const [paradas, setParadas] = useState<Parada[]>(initialParadas)
const [guardando, setGuardando] = useState(false)
const [copiando, setCopiando] = useState(false)
```

Layout:
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Semana: 09–13 Jun 2026     [← Semana anterior] [Semana siguiente →]   │
│                             [Copiar semana anterior]  [Guardar ruta]    │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┤
│  LUNES   │ MARTES   │MIÉRCOLES │  JUEVES  │ VIERNES  │  Agregar parada │
│          │          │          │          │          │                  │
│[Obra A]  │[Obra B]  │          │[Obra C]  │[Obra A]  │ Proyecto: [sel] │
│ 09:00    │ 10:30    │          │ 09:00    │ 14:00    │ Día:      [sel] │
│[×]       │[×]       │          │[×]       │[×]       │ Hora:     [inp] │
│          │          │          │          │          │ [+ Agregar]     │
└──────────┴──────────┴──────────┴──────────┴──────────┴─────────────────┘
```

Funcionalidades:
1. **Agregar parada:** panel lateral derecho — select proyecto, select día, input hora
2. **Quitar parada:** botón "×" en cada `ParadaCard`
3. **Reordenar en mismo día:** botones ↑↓ en cada card (no drag & drop de HTML5 — más simple, más confiable)
4. **Navegar semanas:** botones `← Anterior` / `Siguiente →` cambian el query param `?semana=` con `router.push`
5. **Copiar semana anterior:** llama `copiarSemanaAnterior`, refresca con `router.refresh`
6. **Guardar:** llama `guardarRuta` con todas las paradas actuales
7. **Exportar PDF:** botón que llama a `ExportarRutaBtn`

### `DiaColumna.tsx` (Client Component)

Props: `{ dia: DiaSemana; paradas: Parada[]; onSubir: (idx) => void; onBajar: (idx) => void; onEliminar: (idx) => void }`

- Header: nombre del día en mayúsculas, `text-2xs font-semibold uppercase tracking-widest text-formatto-bark`
- Lista de `ParadaCard` ordenadas por `orden`
- Si vacío: area punteada con "— sin paradas" en text-formatto-sand

### `ParadaCard.tsx` (Client Component)

Props: `{ parada: Parada; onSubir: () => void; onBajar: () => void; onEliminar: () => void }`

- Card `bg-formatto-cream border border-formatto-sand p-3 rounded-none`
- Nombre del proyecto (font-semibold grafito)
- Hora estimada (text-2xs bark)
- Observación si hay (text-xs umber)
- Botones: `↑` `↓` (text-formatto-bark text-xs) + `×` (text-formatto-rojo text-xs)

### `ExportarRutaBtn.tsx` (Client Component)

Props: `{ supervisor: string; semana: string; paradas: Parada[] }`

Genera PDF con `@react-pdf/renderer` en el browser (no servidor).

Estructura del PDF:
```
┌──────────────────────────────────────────────┐
│  [FORMATTO]                                   │
│  Ruta de Visitas — [Nombre Supervisor]        │
│  Semana: 09 al 13 de Junio 2026               │
├──────────────────────────────────────────────┤
│  LUNES                                        │
│  ● 09:00  Obra Los Almendros                  │
│  ● 14:00  Obra Mirador del Valle              │
├──────────────────────────────────────────────┤
│  MARTES                                       │
│  ● 10:30  Obra Parque Central                │
│  ...                                          │
└──────────────────────────────────────────────┘
```

Colores PDF (hexadecimal, no Tailwind):
```typescript
const PDF_COLORS = {
  grafito: "#2B2B2B",
  bark: "#8C7355",
  cream: "#F5F0E8",
  sand: "#D4C9B0",
  rojo: "#CE4620",
  white: "#FFFFFF",
}
```

Al hacer clic en "Exportar PDF":
- Generar PDF con `@react-pdf/renderer`
- Descarga automática con `pdf(...).download(\`ruta_${semana}.pdf\`)`

**Si `@react-pdf/renderer` no está instalado:** `npm install @react-pdf/renderer`
Y agregar a `next.config.ts`:
```typescript
serverExternalPackages: ["xlsx", "@react-pdf/renderer"],
```

---

## Reglas de diseño (obligatorias)

- Solo tokens `formatto-*` en componentes React
- Cards de parada: sin border-radius (rounded-none)
- Columnas del planificador: `min-h-[300px]` para que el área de drop sea visible
- Botones ↑↓ del reordenador: `w-6 h-6 text-xs` — discretos, no prominentes
- Semana navegador: `text-sm font-semibold text-formatto-grafito` con botones `text-formatto-bark hover:text-formatto-grafito`
- Botón "Guardar ruta": `variant="primary"` (grafito)
- Botón "Copiar semana anterior": `variant="secondary"`
- Botón "Exportar PDF": `variant="secondary"` con ícono de descarga

---

## Criterios de aceptación

Claude Code verificará todos antes de aprobar:

- [ ] `npx tsc --noEmit` → sin errores
- [ ] `npx next build` → exitoso
- [ ] Fix `AsignacionGantt` aplicado — barras colorean por tipo FORMATTO/SUBCONTRATO
- [ ] `/supervisores` lista supervisores con badge activo/inactivo
- [ ] Botón "Nuevo supervisor" abre modal y crea en BD
- [ ] Botón "Activar/Desactivar" alterna estado sin borrar
- [ ] `/supervisores/[id]` muestra historial de rutas
- [ ] `/supervisores/[id]/ruta` renderiza `PlanificadorSemanal` con 5 columnas
- [ ] Agregar parada funciona (aparece en la columna del día seleccionado)
- [ ] Botón × elimina parada de la lista local
- [ ] Botones ↑↓ reordenan paradas dentro de un día
- [ ] Navegación semanas cambia query param y carga ruta de esa semana
- [ ] Botón "Guardar ruta" llama `guardarRuta` y persiste en BD
- [ ] Botón "Copiar semana anterior" copia paradas si existen
- [ ] Botón "Exportar PDF" genera y descarga PDF con header Formatto
- [ ] Páginas no rompen si Prisma no está conectado (try/catch)

---

## Notas técnicas

1. **Normalizar semana al lunes:**
   ```typescript
   function toLunes(dateStr: string): string {
     const date = new Date(dateStr)
     const day = date.getDay() // 0=Dom, 1=Lun, ... 6=Sáb
     const diff = day === 0 ? -6 : 1 - day  // ajuste para que el lunes sea el inicio
     date.setDate(date.getDate() + diff)
     return date.toISOString().slice(0, 10)
   }
   ```

2. **`@react-pdf/renderer` en Client Component:**
   El PDF se genera en el browser. Usar `dynamic import` para evitar errores en SSR:
   ```typescript
   // En ExportarRutaBtn.tsx — importar dinámicamente
   import dynamic from "next/dynamic"
   // O simplemente "use client" + import directo (funciona en Next.js App Router)
   ```

3. **`guardarRuta` — lógica upsert:**
   ```typescript
   await prisma.$transaction(async (tx) => {
     let ruta = await tx.rutaVisita.findFirst({
       where: { supervisorId, semana: new Date(semana) }
     })
     if (!ruta) {
       ruta = await tx.rutaVisita.create({ data: { supervisorId, semana: new Date(semana) } })
     }
     // Borrar todas las paradas actuales
     await tx.paradaRuta.deleteMany({ where: { rutaId: ruta.id } })
     // Recrear
     if (paradas.length > 0) {
       await tx.paradaRuta.createMany({
         data: paradas.map((p) => ({ ...p, rutaId: ruta.id }))
       })
     }
   })
   ```

4. **Query param `?semana=` en Server Component:**
   ```typescript
   export default async function RutaPage({
     params,
     searchParams,
   }: {
     params: Promise<{ id: string }>
     searchParams: Promise<{ semana?: string }>
   }) {
     const { id } = await params
     const { semana } = await searchParams
     const semanaActual = semana ? toLunes(semana) : toLunes(new Date().toISOString())
     // Buscar ruta de esa semana...
   }
   ```

5. **Reordenar paradas sin drag & drop nativo:** Evitar `@dnd-kit` o `react-beautiful-dnd` — más complejidad de la que vale para este caso. Botones ↑↓ simples son suficientes y más accesibles.

---

## Formato de entrega obligatorio

```
✅ FASE 5 COMPLETADA: Supervisores y Rutas de Visita
Archivos creados/modificados: [lista completa]
Tests: [pasando / fallando]
→ Listo para revisión de Claude Code
```

---

*Una vez entregado, Claude Code revisa contra los criterios de aceptación.
No iniciar Fase 6 sin aprobación explícita.*
