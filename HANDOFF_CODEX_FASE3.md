# Handoff Codex — Fase 3: Pipeline de Instalación por Unidad

> **Generado por Claude Code (Arquitecto Líder)**
> Leer también `ESTADO_PROYECTO.md` antes de ejecutar.
> No avanzar a Fase 4 sin aprobación de Claude Code.

---

## Contexto de esta fase

Se implementa el seguimiento del proceso de instalación por unidad/departamento.
Cada unidad tiene ítems (muebles) que avanzan por 5 etapas:

```
PEDIDO → FABRICACION → DESPACHO → INSTALACION → ENTREGA_CONFORME
```

También existen dos estados especiales: `ATRASADO` y `OBSERVACION`.

Esta fase convierte `/unidades` (hoy ComingSoon) en el módulo operativo
principal de la app — el que usan los coordinadores día a día.

---

## Archivos base — NO MODIFICAR

Todo lo listado en `ESTADO_PROYECTO.md` sección "Archivos Base", más:
- `app/(dashboard)/proyectos/**` (Fase 2 — no tocar)
- `lib/excel/**` (Fase 2 — no tocar)
- `components/excel/**` (Fase 2 — no tocar)
- `components/proyectos/**` (Fase 2 — no tocar)
- `app/api/excel/**` (Fase 2 — no tocar)
- `app/api/proyectos/**` (Fase 2 — no tocar)

---

## Schema Prisma relevante (ya existe — solo leer)

```prisma
model Unidad {
  id         String  @id @default(cuid())
  proyectoId String
  proyecto   Proyecto @relation(...)
  piso       String
  dpto       String
  torre      String?
  tipo       String?   // CO_1e, CO_2+2e, INTERIOR, PIERNAS, etc.
  creadoEn   DateTime
  items      ItemInstalacion[]
  @@unique([proyectoId, piso, dpto, torre])
}

model ItemInstalacion {
  id            String           @id @default(cuid())
  unidadId      String
  unidad        Unidad           @relation(...)
  sku           String?
  descripcion   String?
  subconjunto   String?
  cantidad      Int              @default(1)
  costo         Float?
  etapa         EtapaInstalacion @default(PEDIDO)
  creadoEn      DateTime
  actualizadoEn DateTime
  historial     HistorialEtapa[]
}

model HistorialEtapa {
  id      String           @id @default(cuid())
  itemId  String
  item    ItemInstalacion  @relation(...)
  etapa   EtapaInstalacion
  fecha   DateTime         @default(now())
  usuario String
  nota    String?
}

enum EtapaInstalacion {
  PEDIDO FABRICACION DESPACHO INSTALACION ENTREGA_CONFORME ATRASADO OBSERVACION
}
```

---

## Componentes existentes a reutilizar (NO recrear)

| Componente | Ruta | Uso en esta fase |
|-----------|------|-----------------|
| `EtapaBadge` | `components/ui/EtapaBadge.tsx` | Badge de etapa en tablas y detalle |
| `PageHeader` | `components/layout/PageHeader.tsx` | Header de cada página |
| `Button` | `components/ui/Button.tsx` | Botones de acción |
| `StatCard` | `components/ui/StatCard.tsx` | KPIs en listado de unidades |
| `LoadingSkeleton` | `components/ui/LoadingSkeleton.tsx` | Estados de carga |
| `ComingSoon` | `components/ui/ComingSoon.tsx` | Ya NO usar en /unidades — reemplazar |

---

## Estructura de archivos a crear

```
lib/actions/
  instalacion.ts         Server Actions: avanzarEtapa, agregarObservacion

components/instalacion/
  PipelineVisual.tsx     Visualización de las 5 etapas con progreso
  AvanzarEtapaBtn.tsx    Botón Client para avanzar etapa con optimistic update
  HistorialEtapa.tsx     Lista de cambios históricos de un ítem

app/(dashboard)/
  unidades/
    page.tsx             Vista global — listado de proyectos con % avance
  proyectos/[id]/
    unidades/
      page.tsx           Listado de unidades del proyecto con estado general
      [uid]/
        page.tsx         Detalle unidad: ítems agrupados por tipo + pipeline
```

---

## Server Actions (`lib/actions/instalacion.ts`)

```typescript
"use server"

// Avanza un ítem a la etapa indicada y registra en historial
export async function avanzarEtapa(
  itemId: string,
  etapa: EtapaInstalacion,
  usuario: string,
  nota?: string
): Promise<{ ok: boolean; error?: string }>

// Agrega observación sin cambiar etapa
export async function agregarObservacion(
  itemId: string,
  nota: string,
  usuario: string
): Promise<{ ok: boolean; error?: string }>
```

Reglas para `avanzarEtapa`:
- Validar que el `itemId` existe
- No permitir retroceder etapas del flujo principal
  (PEDIDO < FABRICACION < DESPACHO < INSTALACION < ENTREGA_CONFORME)
- ATRASADO y OBSERVACION se pueden asignar desde cualquier etapa
- Actualizar `ItemInstalacion.etapa` y crear `HistorialEtapa`
- Usar `prisma.$transaction` para atomicidad
- Retornar `{ ok: false, error: "mensaje" }` sin lanzar excepciones

---

## Páginas

### `/unidades` — vista global (reemplaza ComingSoon)

Server Component. Muestra todos los proyectos con su % de avance de instalación.

- `PageHeader` eyebrow="Gestión" title="Unidades"
- Para cada proyecto: nombre · total unidades · ítems ENTREGA_CONFORME / total ítems · barra de progreso
- Barra de progreso: `bg-formatto-sand` base, `bg-formatto-grafito` fill, ancho = % completado
- Si % = 100 → fill `bg-formatto-rojo` (celebración visual)
- Link a `/proyectos/[id]/unidades` en cada fila

### `/proyectos/[id]/unidades` — listado de unidades del proyecto

Server Component.

- `PageHeader` eyebrow={proyecto.nombre} title="Unidades" actions={filtros}
- 3 StatCards: Total unidades · Ítems completados · % avance general
- Filtros: por piso (select), por tipo (select: COCINA / CLOSET / PIERNAS), por etapa
- Tabla:
  - Columnas: Piso · Dpto · Torre · Tipo · N° ítems · Completados · Etapa dominante · Acciones
  - "Etapa dominante" = la etapa con más ítems en esa unidad
  - `EtapaBadge` para etapa dominante
  - Filas alternas bg-white / bg-formatto-linen
  - Link "Ver detalle" → `/proyectos/[id]/unidades/[uid]`
- Si sin unidades: card con mensaje + link a cargar Excel

### `/proyectos/[id]/unidades/[uid]` — detalle de unidad

Server Component + Client Components para interacción.

- `PageHeader` eyebrow="{piso} — {dpto}" title={tipo ?? "Unidad"} actions={link volver}
- `PipelineVisual` — muestra las 5 etapas principales con count de ítems en cada una
- Ítems agrupados por subconjunto (Cocina, Closet Interior, Piernas, Quincallería, etc.)

Por cada grupo:
```
— COCINA (12 ítems)
┌─────────────────────────────────────────────────────────────┐
│ SKU      │ Descripción          │ Cant │ Costo  │ Etapa     │ Acción  │
│ KCH-001  │ Módulo alto izq      │ 2    │ $45k   │ [PEDIDO]  │ [→ FAB] │
```
- `EtapaBadge` para la etapa actual
- `AvanzarEtapaBtn` — botón que muestra la siguiente etapa lógica
- Al hacer clic: llama Server Action, revalida con `revalidatePath`

Al final: sección `HistorialEtapa` — tabla de todos los cambios de etapa
  (fecha · etapa anterior → nueva · usuario · nota)

---

## Componentes

### `PipelineVisual.tsx` (Server o Client Component)

Props: `conteosPorEtapa: Record<EtapaInstalacion, number>`, `total: number`

Visualización horizontal de las 5 etapas del flujo principal:

```
PEDIDO    FABRICACIÓN    DESPACHO    INSTALACIÓN    ENTREGA CONFORME
  [8]         [3]           [5]          [2]              [1]
  ████████    ███           █████        ██               █
```

- Cada etapa: nombre (text-2xs uppercase bark), número (text-xl black grafito),
  barra proporcional (bg-formatto-sand con fill bg-formatto-grafito)
- ENTREGA_CONFORME completado: fill bg-formatto-rojo
- ATRASADO y OBSERVACION aparecen como badges separados debajo si count > 0

### `AvanzarEtapaBtn.tsx` (Client Component)

Props:
```typescript
{
  itemId: string
  etapaActual: EtapaInstalacion
  usuario: string
  onAvanzado?: () => void
}
```

Lógica de siguiente etapa:
```
PEDIDO           → FABRICACION
FABRICACION      → DESPACHO
DESPACHO         → INSTALACION
INSTALACION      → ENTREGA_CONFORME
ENTREGA_CONFORME → (sin siguiente — botón deshabilitado)
ATRASADO         → (mostrar botón "Retomar" que vuelve a PEDIDO)
OBSERVACION      → (mostrar botón "Resolver" que vuelve a la etapa anterior)
```

- Botón texto: "→ {ETAPA_SIGUIENTE}" (ej: "→ Fabricación")
- variant="secondary" size="sm"
- Al hacer clic: `startTransition` + Server Action `avanzarEtapa`
- Estado loading visual durante la transición
- Sin modal de confirmación para avanzar el flujo normal
- Botones adicionales: "Marcar atrasado" (variant="destructive" size="sm")

### `HistorialEtapa.tsx` (Server Component)

Props: `historial: Array<{etapa, fecha, usuario, nota}>`

- Sección con eyebrow "— Historial de cambios"
- Timeline vertical: punto · fecha · etapa (EtapaBadge) · usuario · nota

---

## Reglas de diseño (obligatorias)

- Solo tokens `formatto-*`
- Barra de progreso: `h-1 bg-formatto-sand rounded-none` con fill `bg-formatto-grafito`
- Tabla ítems: texto `text-formatto-umber`, headers `text-formatto-grafito font-semibold`
- Agrupadores: `text-2xs font-semibold uppercase tracking-widest text-formatto-bark`
  con prefijo "—" (ej: `— COCINA`)
- `AvanzarEtapaBtn` no debe ser más prominente que la etapa actual
- Sin colores hardcodeados

---

## Criterios de aceptación

Claude Code verificará todos antes de aprobar:

- [ ] `npx tsc --noEmit` → sin errores
- [ ] `npx next build` → exitoso
- [ ] `/unidades` lista proyectos con barra de progreso (vacío si sin DB)
- [ ] `/proyectos/[id]/unidades` lista unidades con etapa dominante
- [ ] Filtros de piso/tipo/etapa funcionan (pueden ser Client Component con `useSearchParams`)
- [ ] `/proyectos/[id]/unidades/[uid]` muestra ítems agrupados por subconjunto
- [ ] `PipelineVisual` refleja conteos reales por etapa
- [ ] `AvanzarEtapaBtn` llama Server Action y la página se actualiza sin reload completo
- [ ] `avanzarEtapa` registra en `HistorialEtapa`
- [ ] `avanzarEtapa` rechaza retroceder etapas del flujo principal
- [ ] `HistorialEtapa` muestra el historial cronológico
- [ ] Páginas no rompen si Prisma no está conectado (try/catch)
- [ ] Link "Cargar Excel" en `/proyectos/[id]/unidades` cuando no hay unidades
- [ ] El detalle de proyecto `/proyectos/[id]` agrega link "Ver unidades" → `/proyectos/[id]/unidades`

---

## Notas técnicas

1. **Server Actions con revalidatePath:**
   ```typescript
   import { revalidatePath } from "next/cache"
   // Al final de avanzarEtapa exitoso:
   revalidatePath(`/proyectos/${proyectoId}/unidades/${unidadId}`)
   revalidatePath(`/proyectos/${proyectoId}/unidades`)
   ```

2. **Optimistic update en AvanzarEtapaBtn:**
   Usar `useOptimistic` de React o simplemente `useTransition` con estado local.
   La UI debe reflejar el cambio antes de que el server action responda.

3. **Etapa dominante de una unidad:**
   ```typescript
   // La etapa con más ítems, priorizando: ATRASADO > OBSERVACION > resto por orden del flujo
   function etapaDominante(items: ItemInstalacion[]): EtapaInstalacion {
     if (items.every(i => i.etapa === "ENTREGA_CONFORME")) return "ENTREGA_CONFORME"
     if (items.some(i => i.etapa === "ATRASADO")) return "ATRASADO"
     if (items.some(i => i.etapa === "OBSERVACION")) return "OBSERVACION"
     const counts = items.reduce((acc, i) => {
       acc[i.etapa] = (acc[i.etapa] ?? 0) + 1; return acc
     }, {} as Record<string, number>)
     return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as EtapaInstalacion
   }
   ```

4. **Filtros de unidades:** Implementar como query params en la URL:
   `/proyectos/[id]/unidades?piso=3&tipo=COCINA&etapa=PEDIDO`
   Server Component lee `searchParams`, filtra en la query Prisma (no en JS).

5. **Prisma en Server Actions:** Importar desde `@/lib/prisma` siempre.
   Wrap en try/catch, retornar `{ ok: false, error: "..." }` sin relanzar.

---

## Formato de entrega obligatorio

```
✅ FASE 3 COMPLETADA: Pipeline de Instalación por Unidad
Archivos creados/modificados: [lista completa]
Tests: [pasando / fallando]
→ Listo para revisión de Claude Code
```

---

*Una vez entregado, Claude Code revisa contra los criterios de aceptación.
No iniciar Fase 4 sin aprobación explícita.*
