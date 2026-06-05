# Handoff Codex — Fase 2: Módulo Proyectos + Carga Excel

> **Generado por Claude Code (Arquitecto Líder)**
> Leer también `ESTADO_PROYECTO.md` antes de ejecutar.
> No avanzar a Fase 3 sin aprobación de Claude Code.

---

## Contexto de esta fase

Se implementa el módulo central de la app: gestión de proyectos y carga de
archivos Excel de Formatto (Cocina, Closet Interior y Piernas de Closet).
Este módulo alimenta a todos los demás — sin proyectos no hay unidades,
ni pipeline, ni dotación por proyecto.

---

## Archivos base — NO MODIFICAR

Todo lo listado en `ESTADO_PROYECTO.md` sección "Archivos Base".
Adicionalmente, no modificar:
- `app/(dashboard)/dotacion/page.tsx`
- `app/(dashboard)/costos/page.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `components/ui/ComingSoon.tsx`
- `middleware.ts`

---

## Schema Prisma relevante (ya existe — solo leer)

```prisma
model Proyecto {
  id            String         @id @default(cuid())
  nombre        String
  constructora  String?
  estado        EstadoProyecto @default(ACTIVO)  // ACTIVO | PAUSADO | TERMINADO
  finEstimado   DateTime?
  torre         String?
  observacion   String?
  creadoEn      DateTime       @default(now())
  actualizadoEn DateTime       @updatedAt
  archivos      ArchivoExcel[]
  unidades      Unidad[]
}

model ArchivoExcel {
  id                 String      @id @default(cuid())
  proyectoId         String
  tipo               TipoArchivo // COCINA | CLOSET_INTERIOR | PIERNAS | OTRO
  nombreOriginal     String
  urlBlob            String?
  filasLeidas        Int
  unidadesDetectadas Int
  cargadoPor         String
  creadoEn           DateTime    @default(now())
}

model Unidad {
  id         String  @id @default(cuid())
  proyectoId String
  piso       String
  dpto       String
  torre      String?
  tipo       String? // CO_1e, CO_2+2e, INTERIOR, PIERNAS, etc.
  items      ItemInstalacion[]
  @@unique([proyectoId, piso, dpto, torre])
}

model ItemInstalacion {
  id            String           @id @default(cuid())
  unidadId      String
  sku           String?
  descripcion   String?
  subconjunto   String?
  cantidad      Int              @default(1)
  costo         Float?
  etapa         EtapaInstalacion @default(PEDIDO)
}
```

---

## Estructura de archivos a crear

```
lib/excel/
  detector.ts          Detecta tipo por hojas disponibles en el .xlsx
  parsers/
    cocina.ts          Parser hoja NV_RTA
    closet.ts          Parser hoja CUADRO (Interior y Piernas)
  types.ts             Tipos compartidos de parseo

components/excel/
  DropZone.tsx         Client Component — drag & drop de archivos
  ExcelPreview.tsx     Client Component — tabla preview + resumen
  TipoDetector.tsx     Badge de tipo detectado automáticamente

app/(dashboard)/proyectos/
  page.tsx             Reemplazar ComingSoon → listado real de proyectos
  new/
    page.tsx           Formulario crear proyecto + carga Excel opcional
  [id]/
    page.tsx           Detalle proyecto: info + archivos cargados + unidades resumen
    carga/
      page.tsx         Cargar / reemplazar archivos Excel del proyecto

app/api/excel/
  preview/route.ts     POST — parsea buffer, devuelve preview JSON (sin persistir)
  upload/route.ts      POST — parsea + persiste en BD + sube a Supabase Storage
```

---

## Reglas de parseo Excel (críticas — seguir al pie de la letra)

### Detección de tipo (`lib/excel/detector.ts`)
```
Si el workbook tiene hoja "NV_RTA"  → tipo COCINA
Si el workbook tiene hoja "CUADRO"  → leer SUB CONJUNTO para distinguir:
    Si alguna fila tiene SUB CONJUNTO = "PIERNAS" → tipo PIERNAS
    Si no                                          → tipo CLOSET_INTERIOR
Si ninguna de las anteriores        → tipo OTRO
```

### Parser Cocina — hoja `NV_RTA` (`lib/excel/parsers/cocina.ts`)
```
- Fila 1 = headers
- Columnas clave: Recuento · SKU · Descripcion · Piso · Departamento ·
                  Tipo Cocina · Subconjunto
- Agrupar filas por { Piso, Departamento } → cada grupo = una Unidad
- campo "Tipo Cocina" → unidad.tipo (CO_1e, CO_2+2e, etc.)
- Cada fila del grupo → un ItemInstalacion con sku, descripcion, subconjunto, cantidad=Recuento
- Si falta columna opcional → null, no fallar
- Duplicados mismo SKU en mismo DPTO → sumar cantidades
```

### Parser Closet — hoja `CUADRO` (`lib/excel/parsers/closet.ts`)
```
- Filas 1–2 vacías → ignorar (headers en fila 3, usar offset { header: 2 } en SheetJS)
- Columna A siempre vacía → ignorar
- Columnas clave: PISO · DPTO · TIPO · FICHA · COD · MUEBLE · CANTIDAD ·
                  CONJUNTO · SUB CONJUNTO · COSTO · TORRE
- Agrupar por { PISO, DPTO } → cada grupo = una Unidad
- unidad.torre = campo TORRE (puede ser null)
- SUB CONJUNTO distingue el tipo de ítem (INTERIOR / PIERNAS / QUINC.)
- Cada fila → ItemInstalacion con sku=COD, descripcion=MUEBLE,
              subconjunto=SUB CONJUNTO, cantidad=CANTIDAD, costo=COSTO
- Si COSTO es 0 o null → registrar igual (no filtrar)
- Filas sin PISO → ignorar
```

### Tipos compartidos (`lib/excel/types.ts`)
```typescript
export type UnidadParseada = {
  piso: string
  dpto: string
  torre?: string | null
  tipo?: string | null
  items: ItemParseado[]
}

export type ItemParseado = {
  sku?: string | null
  descripcion?: string | null
  subconjunto?: string | null
  cantidad: number
  costo?: number | null
}

export type ResultadoParseo = {
  tipo: "COCINA" | "CLOSET_INTERIOR" | "PIERNAS" | "OTRO"
  unidades: UnidadParseada[]
  filasLeidas: number
  error?: string
}
```

---

## API Routes

### `POST /api/excel/preview` — solo parsea, no persiste

Request: `FormData` con campo `file` (el .xlsx / .xlsm)
Response JSON:
```json
{
  "tipo": "COCINA",
  "filasLeidas": 142,
  "unidades": 24,
  "preview": [ ...primeras 20 filas como array de objetos... ],
  "resumen": { "totalItems": 142, "tipos": ["CO_1e", "CO_2+2e"] }
}
```
- Usar `xlsx` (SheetJS) en Node runtime — agregar `export const runtime = "nodejs"` a la route
- En caso de error, devolver `{ "error": "mensaje claro" }` con status 400

### `POST /api/excel/upload` — parsea + persiste + sube archivo

Request: `FormData` con campos:
  - `file` — el archivo Excel
  - `proyectoId` — string
  - `modo` — `"reemplazar"` | `"agregar"`
  - `cargadoPor` — string (email del usuario)

Flujo:
1. Parsear con `lib/excel/detector.ts` + parser correspondiente
2. Si `modo = "reemplazar"`: eliminar unidades e ítems previos del mismo tipo en el proyecto
3. Si `modo = "agregar"`: respetar los `@@unique` de Unidad — upsert por (proyectoId, piso, dpto, torre)
4. Persistir en BD: `Unidad` → `ItemInstalacion` vía `prisma`
5. Registrar `ArchivoExcel` con metadatos
6. Subir archivo original a Supabase Storage bucket `excel-uploads` vía `getSupabaseAdmin()`
   - Si Supabase no está configurado → continuar sin subir (urlBlob = null), no fallar
7. Response: `{ "ok": true, "unidades": N, "items": N }`

---

## Páginas

### `/proyectos` — listado
- Server Component, usa Prisma
- `PageHeader` eyebrow="Gestión" title="Proyectos" actions={Botón "Nuevo proyecto" → /proyectos/new}
- Tabla: Nombre · Constructora · Estado · Fin estimado · N° unidades · Acciones
- Badge de estado: ACTIVO (Grafito bg, White text) · PAUSADO (Sand bg) · TERMINADO (Linen bg)
- Fila con link a `/proyectos/[id]`
- Si no hay proyectos: card vacío con CTA "Crear primer proyecto"

### `/proyectos/new` — crear + cargar Excel
- Client Component (formulario interactivo)
- Sección 1: Datos del proyecto — Nombre* · Constructora · Torre · Fin estimado · Observación
- Sección 2: Carga Excel (opcional al crear) — componente `DropZone`
  - Al soltar archivo: llama `/api/excel/preview` → muestra `ExcelPreview`
  - Botón "Crear proyecto" → crea proyecto y opcionalmente sube el Excel en un solo submit
- Usar React Hook Form + Zod para validación
- Esquema Zod mínimo: `nombre` requerido (min 3 chars)

### `/proyectos/[id]` — detalle
- Server Component
- `PageHeader` con nombre del proyecto + badge estado + botón "Cargar Excel"
- Card info: Constructora · Torre · Fin estimado · Fecha creación · Observación
- Tabla archivos cargados: Tipo · Nombre archivo · Fecha · N° unidades · N° ítems
- Resumen unidades: total · por piso (agrupado)

### `/proyectos/[id]/carga` — cargar/reemplazar Excel
- Client Component
- `PageHeader` eyebrow="Proyectos" title="Cargar Excel"
- `DropZone` — drag & drop
- Al detectar tipo: `TipoDetector` badge + `ExcelPreview`
- Si el proyecto ya tiene datos del mismo tipo: modal de confirmación
  ```
  ┌─────────────────────────────────────┐
  │  Ya existen datos de tipo COCINA    │
  │  para este proyecto.                │
  │                                     │
  │  ¿Qué deseas hacer?                 │
  │                                     │
  │  [Reemplazar]  [Agregar]  [Cancelar]│
  └─────────────────────────────────────┘
  ```
- Botón "Confirmar carga" → POST a `/api/excel/upload`
- Feedback de resultado: "X unidades · Y ítems cargados"

---

## Componentes

### `DropZone.tsx` (Client Component)
Props: `onFile: (file: File) => void`
- Área drag & drop estilo Formatto (borde dashed Sand, bg Cream)
- Al hover/drag: borde Grafito
- Texto: "Arrastra tu archivo Excel aquí · o haz clic para seleccionar"
- Subtext: "Formatos: .xlsx (Cocina) · .xlsm (Closet / Piernas)"
- Input file oculto aceptando `.xlsx,.xlsm`
- Sin librerías externas de drag & drop

### `ExcelPreview.tsx` (Client Component)
Props: `data: PreviewResponse | null`, `loading: boolean`
- Skeleton mientras carga
- Badge tipo detectado (con `TipoDetector`)
- Resumen: N° unidades · N° ítems · tipos detectados
- Tabla primeras 20 filas con columnas dinámicas según tipo
- Filas alternas Cream/Linen, texto Umber, headers Grafito

### `TipoDetector.tsx`
Props: `tipo: "COCINA" | "CLOSET_INTERIOR" | "PIERNAS" | "OTRO"`
- Badge: COCINA → bg Grafito · CLOSET INTERIOR → bg Umber · PIERNAS → bg Bark · OTRO → bg Sand
- Texto White en los tres primeros, Grafito en OTRO

---

## Reglas de diseño (obligatorias)

- Solo clases Tailwind con tokens `formatto-*`
- Cards: `bg-formatto-cream border border-formatto-sand rounded-none`
- Tablas: header `bg-formatto-cream`, alterno `bg-white / bg-formatto-linen`
- Botón primario: `Button` variant="primary" de `components/ui/Button.tsx`
- Modal de confirmación: borde superior `border-t-2 border-formatto-rojo`
- Sin colores hardcodeados

---

## Criterios de aceptación

Claude Code verificará todos antes de aprobar:

- [ ] `npx tsc --noEmit` → sin errores
- [ ] `npx next build` → exitoso
- [ ] `/proyectos` lista proyectos desde Prisma (vacío si BD no conectada — no rompe)
- [ ] `/proyectos/new` formulario valida con Zod — nombre requerido
- [ ] `DropZone` acepta `.xlsx` y `.xlsm` y llama `onFile`
- [ ] `POST /api/excel/preview` con un Excel de Cocina real devuelve tipo="COCINA" y preview
- [ ] `POST /api/excel/preview` con un Excel de Closet devuelve tipo="CLOSET_INTERIOR" o "PIERNAS"
- [ ] `POST /api/excel/upload` con modo="agregar" persiste Unidades e Items en BD
- [ ] Modal de confirmación aparece cuando el proyecto ya tiene datos del mismo tipo
- [ ] `/proyectos/[id]` muestra archivos cargados y resumen de unidades
- [ ] `/proyectos/[id]/carga` flujo completo sin errores de consola
- [ ] `next.config.ts` tiene `serverExternalPackages: ['xlsx']` (SheetJS requiere Node)
- [ ] Diseño consistente con tokens Formatto

---

## Notas técnicas importantes

1. **SheetJS en Node runtime:** Agregar en `next.config.ts`:
   ```ts
   const nextConfig: NextConfig = {
     reactStrictMode: true,
     serverExternalPackages: ['xlsx'],
   }
   ```
   Y en cada API route que use xlsx: `export const runtime = "nodejs"`

2. **Prisma en Server Components:** Importar siempre desde `@/lib/prisma`
   (el singleton con PrismaPg adapter). No instanciar PrismaClient directamente.

3. **Supabase Storage:** Usar `getSupabaseAdmin()` de `@/lib/supabase`.
   Si retorna `null` (env vars no configuradas), omitir upload silenciosamente.
   Bucket: `excel-uploads` · Path sugerido: `{proyectoId}/{timestamp}_{nombreOriginal}`

4. **Manejo de errores de BD:** Si Prisma falla por DATABASE_URL no configurada,
   las páginas deben mostrar estado vacío (no lanzar error 500).
   Usar try/catch en todos los Server Components que lean de Prisma.

---

## Formato de entrega obligatorio

```
✅ FASE 2 COMPLETADA: Módulo Proyectos + Carga Excel
Archivos creados/modificados: [lista completa]
Tests: [pasando / fallando]
→ Listo para revisión de Claude Code
```

---

*Una vez entregado, Claude Code revisa contra los criterios de aceptación.
No iniciar Fase 3 sin aprobación explícita.*
