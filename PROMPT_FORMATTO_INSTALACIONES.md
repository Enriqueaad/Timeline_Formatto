# Prompt — Formatto · Dashboard de Gestión de Instalaciones
**App Next.js 14 · Uso interno Formatto · Vercel · Formatto Design System**

---

## Contexto del Producto

Formatto es una empresa chilena fabricante de muebles (cocina, closet interior,
piernas de closet y más) que vende e instala sus productos en proyectos
inmobiliarios de constructoras clientes. Esta herramienta es de **uso interno
de Formatto** para gestionar:

1. **Carga de proyectos** desde archivos Excel con estructura conocida
2. **Dotación de personal** por obra: costos, supervisores, evaluaciones,
   línea de tiempo, rutas de visita y avance
3. **Seguimiento del proceso** de instalación por unidad/departamento

**Flujo del proceso de instalación:**
```
PEDIDO → FABRICACIÓN → DESPACHO → INSTALACIÓN → ENTREGA CONFORME
```

---

## Stack Técnico

- **Next.js 14** · App Router · TypeScript estricto
- **Tailwind CSS** — tokens Formatto en tailwind.config.ts (sin librerías UI externas)
- **Prisma ORM + PostgreSQL** (SQLite para desarrollo local)
- **NextAuth.js** — roles: Admin | Coordinador | Supervisor | Solo Lectura
- **SheetJS (xlsx)** para parseo de archivos Excel en el servidor
- **Recharts** para gráficos, líneas de tiempo y KPIs
- **date-fns** para manejo de fechas
- **Zod** para validación de formularios y API routes
- **React Hook Form** para todos los formularios
- **@react-pdf/renderer** para reportes y actas PDF
- **Vercel** como plataforma de despliegue (Vercel Postgres en producción)
- **Vercel Blob** para almacenamiento de archivos Excel subidos

---

## Sistema de Diseño — Formatto Brand System

### Tokens de color (tailwind.config.ts + globals.css)

```css
--formatto-white:   #FFFFFF   /* fondo principal */
--formatto-cream:   #F5F0E8   /* fondo cards, header tablas */
--formatto-linen:   #EDE6D6   /* filas alternas, highlights sutiles */
--formatto-sand:    #D4C9B0   /* bordes, líneas separadoras */
--formatto-bark:    #8C7355   /* labels, captions, eyebrows */
--formatto-umber:   #5C4A32   /* texto cuerpo, tabla body */
--formatto-grafito: #2B2B2B   /* títulos, sidebar, texto fuerte */
--formatto-rojo:    #CE4620   /* ÚNICO acento — alertas críticas,
                                atrasos, vencimientos de contrato */
```

### Tipografía

```
font-family: 'NB Grotesk', 'Helvetica Neue', Arial, sans-serif

REGLA CLAVE — Peso inverso al tamaño:
Cuanto más grande el texto, más liviano el peso.

Hero / KPI:         900 (Black)    44–56px   Grafito
Títulos sección:    300 (Light)    28–36px   Grafito
Subtítulos:         300 (Light)    16–18px   Umber
Eyebrow sección:    600 (Semibold) 10px      Bark
                    ALL CAPS · letter-spacing: 0.1em · formato: "— DOTACIÓN"
Body / descripción: 400 (Regular)  13–14px   Umber
Table headers:      600 (Semibold) 12px      Grafito
Captions:           300 (Light)    11px      Bark
```

### Principios de UI

```
GEOMETRÍA:
  - border-radius: 0px en cards y contenedores principales
  - border-radius: 2px en botones, inputs y badges únicamente
  - Sombras: máximo 0 1px 3px rgba(0,0,0,0.06)
  - Sin gradientes de color

SIDEBAR (Grafito #2B2B2B):
  - Logo Formatto arriba: isotipo rojo + wordmark blanco
  - Nav: texto White opacidad 0.7 · activo White 1.0
  - Item activo: borde izquierdo 2px Rojo + fondo rgba(255,255,255,0.05)
  - Usuario logueado al pie

CARDS: fondo Cream · borde 1px Sand · sin sombra · border-radius 0px

TABLAS:
  - Header: Cream + Grafito Semibold + borde bottom Sand 1px
  - Filas alternas: White / Linen
  - Bordes: Sand 0.5px · Texto: Umber

BOTONES:
  - Primario:    fondo Grafito · texto White · hover #1a1a1a
  - Secundario:  borde Sand · fondo White · texto Grafito · hover Cream
  - Destructivo: borde Rojo · texto Rojo · hover Rojo 5% opacidad

ESTADOS DEL FLUJO (badges):
  - PEDIDO:           fondo Linen  · texto Bark
  - FABRICACIÓN:      fondo Sand   · texto Umber
  - DESPACHO:         fondo Linen  · texto Grafito · borde Sand
  - INSTALACIÓN:      fondo Grafito · texto White
  - ENTREGA CONFORME: fondo White  · texto Grafito · borde Sand 1px
  - ATRASADO:         fondo Rojo   · texto White
  - OBSERVACIÓN:      borde Rojo   · texto Rojo

EVALUACIÓN PERSONAL (badges numéricos 1–5):
  - 5: fondo Grafito · texto White       (Excelente)
  - 4: fondo Umber   · texto White       (Muy Bueno)
  - 3: fondo Bark    · texto White       (Bueno)
  - 2: fondo Sand    · texto Grafito     (Regular)
  - 1: fondo Rojo    · texto White       (Deficiente)

GRÁFICOS (Recharts):
  - Datos principales:  Grafito #2B2B2B
  - Datos secundarios:  Bark #8C7355
  - Alerta / atraso:    Rojo Formatto #CE4620
  - Grilla: Sand 0.5px · Tooltips: fondo Cream · borde Sand

LOADING: skeletons Linen con shimmer Sand
```

---

## Módulo 1 — Carga de Proyectos desde Excel

### Tipos de archivo soportados

Formatto maneja tres tipos de Excel por proyecto. Pueden subirse juntos
o por separado. El sistema detecta el tipo por la hoja activa indicada:

| Tipo | Archivo | Hoja a leer | Columnas clave |
|---|---|---|---|
| **Cocina** | `.xlsx` | `NV_RTA` | Recuento · SKU · Descripcion · Piso · Departamento · Tipo Cocina · Subconjunto |
| **Closet Interior** | `.xlsm` | `CUADRO` | PISO · DPTO · TIPO · FICHA · COD · MUEBLE · CANTIDAD · CONJUNTO · SUB CONJUNTO · COSTO · TORRE |
| **Piernas Closet** | `.xlsm` | `CUADRO` | Misma estructura que Closet Interior, SUB CONJUNTO = 'PIERNAS' |

### Flujo de carga

```
1. Usuario arrastra o selecciona uno o más archivos Excel
2. Sistema detecta tipo (Cocina / Closet Interior / Piernas)
   → por nombre de hoja disponible: si tiene NV_RTA → Cocina
   → si tiene CUADRO → leer SUB CONJUNTO para distinguir Interior/Piernas
3. Muestra preview de los datos parseados antes de confirmar
   → tabla con primeras 20 filas · resumen: N° dptos · N° piezas · tipos
4. Usuario asigna el archivo a un Proyecto existente o crea uno nuevo
5. Confirmar → datos se persisten en BD
6. Si el proyecto ya tenía datos del mismo tipo → ofrecer: Reemplazar / Agregar / Cancelar
```

### Reglas de parseo

```
COCINA (NV_RTA):
  - Fila 1 = headers (Recuento, SKU, Descripcion, ...)
  - Agrupar por (Piso, Departamento) → cada grupo = una Unidad
  - Cada fila dentro del grupo = un ItemInstalacion tipo COCINA
  - Campo 'Tipo Cocina' (CO_1e, CO_2+2e, etc.) → tipo de unidad

CLOSET CUADRO (Interior y Piernas):
  - Headers en fila 3 (filas 1-2 vacías — ignorar)
  - Columna A siempre vacía — ignorar
  - Agrupar por (PISO, DPTO) → cada grupo = una Unidad
  - SUB CONJUNTO distingue: INTERIOR / PIERNAS / QUINC. (quincallería)
  - Campo TORRE → torre del edificio (si aplica)
  - Campo COSTO puede ser 0 o nulo — registrar igual

MANEJO DE VARIACIONES:
  - Si faltan columnas opcionales → registrar null, no fallar
  - Si la hoja indicada no existe → mostrar error claro al usuario
    con lista de hojas disponibles en el archivo
  - Duplicados (mismo SKU/COD en mismo DPTO) → sumar cantidades
```

### Modelo de datos de carga

```prisma
model ArchivoExcel {
  id          String   @id @default(cuid())
  proyectoId  String
  proyecto    Proyecto @relation(fields: [proyectoId], references: [id])
  tipo        TipoArchivo  // COCINA | CLOSET_INTERIOR | PIERNAS | OTRO
  nombreOriginal String
  urlBlob     String
  filasLeidas Int
  unidadesDetectadas Int
  cargadoPor  String
  creadoEn    DateTime @default(now())
}

enum TipoArchivo { COCINA CLOSET_INTERIOR PIERNAS OTRO }
```

---

## Módulo 2 — Dotación de Personal

### Estructura de datos (basada en Excel real TABLA CLAUDE)

```
Columnas del Excel de dotación:
N° · RUT · Nombre · Paterno · Materno · TipoContrato · Desvincular ·
TIPO · Cargo · OBRA · CANTIDAD · CANT. SUBCONTRATO ·
EVALUACION · SUPERVISOR · COSTO · Fin Proyecto
```

### Modelo de datos de dotación

```prisma
model Personal {
  id             String   @id @default(cuid())
  rut            String   @unique
  nombre         String
  paterno        String
  materno        String?
  tipoContrato   TipoContrato  // PLAZO_FIJO | INDEFINIDO
  tipo           TipoPersonal  // FORMATTO | SUBCONTRATO
  cargo          String        // INSTALADOR | REMATADOR | AYUD. INSTALADOR | etc.
  estado         EstadoPersonal @default(ACTIVO)
  asignaciones   AsignacionPersonal[]
  evaluaciones   Evaluacion[]
  creadoEn       DateTime @default(now())
  actualizadoEn  DateTime @updatedAt
}

model AsignacionPersonal {
  id            String    @id @default(cuid())
  personalId    String
  personal      Personal  @relation(fields: [personalId], references: [id])
  proyectoId    String
  proyecto      Proyecto  @relation(fields: [proyectoId], references: [id])
  supervisorId  String?
  supervisor    Supervisor? @relation(fields: [supervisorId], references: [id])
  cantidad      Int       @default(1)
  cantSubcontrato Int?
  costoMensual  Int       // en CLP
  fechaInicio   DateTime
  fechaFin      DateTime? // null = vigente · fecha = fin estimado proyecto
  desvincular   Boolean   @default(false)
  creadoEn      DateTime  @default(now())
  actualizadoEn DateTime  @updatedAt
}

model Evaluacion {
  id          String   @id @default(cuid())
  personalId  String
  personal    Personal @relation(fields: [personalId], references: [id])
  proyectoId  String
  proyecto    Proyecto @relation(fields: [proyectoId], references: [id])
  nota        Int      // 1 a 5
  periodo     DateTime // mes al que corresponde
  observacion String?
  evaluadoPor String
  creadoEn    DateTime @default(now())
}

model Supervisor {
  id           String   @id @default(cuid())
  nombre       String   // Jose, Robinson, Ana, Marcos, Pablo, etc.
  rut          String?  @unique
  email        String?
  telefono     String?
  activo       Boolean  @default(true)
  asignaciones AsignacionPersonal[]
  rutasVisita  RutaVisita[]
  creadoEn     DateTime @default(now())
}

model RutaVisita {
  id           String     @id @default(cuid())
  supervisorId String
  supervisor   Supervisor @relation(fields: [supervisorId], references: [id])
  semana       DateTime   // lunes de la semana (date only)
  paradas      ParadaRuta[]
  creadoEn     DateTime   @default(now())
  actualizadoEn DateTime  @updatedAt
}

model ParadaRuta {
  id          String     @id @default(cuid())
  rutaId      String
  ruta        RutaVisita @relation(fields: [rutaId], references: [id])
  proyectoId  String
  proyecto    Proyecto   @relation(fields: [proyectoId], references: [id])
  orden       Int
  diaVisita   DiaSemana  // LUNES | MARTES | MIERCOLES | JUEVES | VIERNES
  horaEstimada String?   // "09:00"
  observacion String?
}

model AvanceObra {
  id          String   @id @default(cuid())
  proyectoId  String
  proyecto    Proyecto @relation(fields: [proyectoId], references: [id])
  fecha       DateTime // fecha del registro de avance
  porcentaje  Float    // 0.0 a 100.0 — % unidades completadas
  unidadesCompletadas Int
  unidadesTotales     Int
  registradoPor String
  observacion  String?
  creadoEn     DateTime @default(now())
}

enum TipoContrato   { PLAZO_FIJO INDEFINIDO }
enum TipoPersonal   { FORMATTO SUBCONTRATO }
enum EstadoPersonal { ACTIVO INACTIVO LICENCIA DESVINCULADO }
enum DiaSemana      { LUNES MARTES MIERCOLES JUEVES VIERNES SABADO }
```

---

## Estructura de Rutas (App Router)

```
/                                    → redirect /dashboard
/dashboard                           → KPIs globales
/proyectos                           → listado proyectos
/proyectos/new                       → crear proyecto + cargar Excel
/proyectos/[id]                      → detalle proyecto
/proyectos/[id]/carga                → cargar/reemplazar archivos Excel
/proyectos/[id]/unidades             → listado unidades + estado instalación
/proyectos/[id]/unidades/[uid]       → detalle unidad: items por etapa
/proyectos/[id]/avance               → registrar y ver historial de avance
/dotacion                            → vista global de dotación
/dotacion/[proyectoId]               → dotación específica de un proyecto
/supervisores                        → gestión de supervisores
/supervisores/[id]/ruta              → planificador de ruta semanal
/reportes                            → reportes y exportaciones
/api/excel/upload                    → POST: subir y parsear Excel
/api/excel/preview                   → POST: preview sin persistir
/api/proyectos/[id]/avance           → POST: registrar avance
/api/dotacion/[id]/mover             → POST: mover personal entre proyectos
/api/rutas/[supervisorId]/semana     → GET/POST: ruta semanal
```

---

## Vistas en Detalle

### /dashboard

**StatCards** (eyebrow Bark ALL CAPS, número Black 48px):
- `— PROYECTOS ACTIVOS`
- `— PERSONAL EN OBRA` (suma de CANTIDAD activos)
- `— COSTO TOTAL DOTACIÓN` (suma costoMensual vigentes, en CLP formateado)
- `— CONTRATOS POR VENCER` (fin ≤ 30 días, número en Rojo Formatto)

**Gráfico de avance**: línea de tiempo por proyecto — eje X = semanas,
eje Y = % avance. Cada proyecto una línea en Grafito/Bark.

**Tabla de proyectos**: Proyecto · Supervisores · Personal · Costo mes ·
% Avance · Fin estimado · Estado. Ordenada por urgencia.

---

### /proyectos/new y /proyectos/[id]/carga

**Zona de carga de Excel** (drag & drop + selector):
```
┌─────────────────────────────────────────────────────┐
│  Arrastra tus archivos Excel aquí                   │
│  o haz clic para seleccionar                        │
│                                                     │
│  Formatos: .xlsx (Cocina) · .xlsm (Closet/Piernas) │
└─────────────────────────────────────────────────────┘
```

Después de seleccionar:
1. **Detección automática** del tipo por estructura de hojas
2. **Preview tabla**: primeras 20 filas parseadas con columnas reales
3. **Resumen**: N° unidades detectadas · N° piezas · tipos de mueble
4. **Selector de proyecto**: asignar a proyecto existente o crear nuevo
5. **Botón Confirmar carga** → persiste en BD + sube archivo a Vercel Blob

Si ya existen datos: modal de confirmación con opciones Reemplazar / Agregar.

---

### /dotacion y /dotacion/[proyectoId]

**Vista de dotación** con 4 sub-vistas en tabs:

**Tab 1 — TABLA ACTUAL**
Tabla completa del personal asignado al proyecto:
`N° · Nombre · RUT · Cargo · Tipo Contrato · Supervisor · Cantidad ·
Costo Mensual · Evaluación (badge 1-5) · Fin Proyecto · Acciones`

Acciones por fila:
- **Mover** → modal: seleccionar proyecto destino + fecha efectiva
- **Evaluar** → modal: nota 1-5 + observación + periodo
- **Desvincular** → confirmación + fecha
- **Editar** → modal con campos del registro

**Tab 2 — LÍNEA DE TIEMPO**
Gráfico tipo Gantt horizontal:
- Eje Y: nombre de cada persona
- Eje X: meses (ventana deslizable 6–12 meses)
- Barras: duración de la asignación en el proyecto
- Color: Grafito = activo, Sand = futuro/estimado, Rojo = vencido
- Puntos de evaluación marcados sobre la barra (tooltip con nota)
- Al hacer hover: nombre, cargo, costo, supervisor, evaluación vigente

**Tab 3 — COSTO POR PERÍODO**
Gráfico de barras apiladas por mes:
- Stack: Personal FORMATTO vs Subcontrato
- Línea de tendencia en Bark
- Tabla debajo: mes · n° personas · costo total · variación vs mes anterior
- Selector de rango: 3 / 6 / 12 meses

**Tab 4 — AVANCE DE OBRA**
Gráfico de línea: % avance vs tiempo (registros históricos de AvanceObra)
- Botón "Registrar avance" → modal: % actual + unidades completadas/total + obs
- Tabla de registros históricos: fecha · % · unidades · registró · obs
- Indicador de velocidad: proyección de fecha de término basada en tendencia

---

### /supervisores/[id]/ruta

**Planificador de ruta semanal** (Client Component interactivo):

```
Semana: [selector de semana] ← → 

LUNES      MARTES     MIÉRCOLES  JUEVES     VIERNES
─────────  ─────────  ─────────  ─────────  ─────────
[Obra A]   [Obra C]   [Obra A]   [Obra D]   [Obra B]
09:00      08:30      14:00      09:00      10:00
─────────
[+ Agregar]
```

- Drag & drop de proyectos entre días
- Cada parada: proyecto + hora estimada + observación
- Botón "Guardar ruta" → persiste en BD
- Botón "Copiar semana anterior" → clona ruta
- Vista de semanas anteriores (solo lectura)
- Exportar ruta a PDF con header Formatto

---

## Componentes Clave

```
components/
  excel/
    DropZone.tsx            Drag & drop de archivos Excel
    ExcelPreview.tsx        Tabla preview de datos parseados
    TipoDetector.tsx        Badge de tipo detectado automáticamente
  dotacion/
    DotacionTable.tsx       Tabla de personal con acciones inline
    TimelineGantt.tsx       Gantt de asignaciones por persona (Recharts)
    CostoChart.tsx          Barras apiladas por mes (Recharts)
    AvanceLineChart.tsx     Línea de avance % en el tiempo (Recharts)
    MoverPersonalModal.tsx  Seleccionar proyecto destino + fecha
    EvaluarModal.tsx        Nota 1-5 + observación + periodo
  ruta/
    RutaPlanner.tsx         Planificador semanal drag & drop
    ParadaCard.tsx          Card de visita: proyecto + hora + obs
  ui/
    StatCard.tsx            KPI número Black + eyebrow Bark
    DataTable.tsx           Sort · filter · paginación server-side
    PipelineBadge.tsx       Pipeline visual 5 etapas
    EtapaBadge.tsx          Badge estado individual
    EvaluacionBadge.tsx     Badge numérico 1-5 con colores
    ProgressBar.tsx         Barra progreso Grafito/Sand
    ConfirmDialog.tsx       Confirmación minimal
    FormField.tsx           Input/Select con label Bark
    LoadingSkeleton.tsx     Skeleton Linen + shimmer Sand
  layout/
    Sidebar.tsx             Grafito · logo Formatto · nav · usuario
    PageHeader.tsx          Eyebrow + título Light + acciones
    FilterBar.tsx           Fila de filtros reutilizable
```

---

## Lógica de Parseo Excel (servidor)

```typescript
// lib/excel/parsers/cocina.ts
import * as XLSX from 'xlsx'

export function parseCocina(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets['NV_RTA']
  if (!ws) throw new Error('Hoja NV_RTA no encontrada')

  const rows = XLSX.utils.sheet_to_json(ws)
  // Agrupar por { Piso, Departamento } → Unidad
  // Cada fila dentro del grupo → ItemInstalacion tipo COCINA
  return agruparPorUnidad(rows, 'Piso', 'Departamento')
}

// lib/excel/parsers/closet.ts
export function parseCloset(buffer: Buffer, subtipo: 'INTERIOR' | 'PIERNAS') {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets['CUADRO']
  if (!ws) throw new Error('Hoja CUADRO no encontrada')

  // Headers en fila 3 (offset: header: 2)
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  const headers = rows[2] as string[]
  const data = rows.slice(3).map(r => Object.fromEntries(
    headers.map((h, i) => [h, (r as any[])[i]])
  ))
  return agruparPorUnidad(data.filter(r => r['PISO']), 'PISO', 'DPTO')
}

// lib/excel/detector.ts — detecta tipo por hojas disponibles
export function detectarTipo(buffer: Buffer): TipoArchivo {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheets = wb.SheetNames
  if (sheets.includes('NV_RTA')) return 'COCINA'
  if (sheets.includes('CUADRO')) return 'CLOSET' // Interior o Piernas
  return 'OTRO'
}
```

---

## Seed de Datos (prisma/seed.ts)

```
- 5 constructoras clientes chilenas
- 8 proyectos activos con nombres reales del Excel:
  CHICAUMA 9.1, LOS CIPRESES, V.P.PEÑALOLEN, LOS SAUCES,
  MAGNOLIA, PUERTA FLORIDA, VIENTO NORTE A1-A2, SOLANA MARBELLA
- Personal real de dotación (anonimizado) — 20 registros con
  cargos: INSTALADOR, REMATADOR, AYUD. INSTALADOR
- 4 supervisores: Jose, Robinson, Ana, Marcos, Pablo
- Asignaciones vigentes y 3 meses de historial
- Registros de avance mensual por proyecto (últimos 3 meses)
- 2 rutas de visita ejemplo por supervisor
- Evaluaciones periódicas (nota 1-5) para personal activo
- Usuarios de prueba:
    admin@formatto.design    / Admin1234!   (Admin)
    coord@formatto.design    / Coord1234!   (Coordinador)
    super@formatto.design    / Super1234!   (Supervisor)
```

---

## Configuración Vercel

```
Variables de entorno (.env.example):
  DATABASE_URL=          # Vercel Postgres en prod / SQLite en dev
  NEXTAUTH_SECRET=       # openssl rand -base64 32
  NEXTAUTH_URL=          # https://instalaciones.formatto.design
  BLOB_READ_WRITE_TOKEN= # Vercel Blob para archivos Excel subidos

next.config.ts:
  - output: 'standalone'
  - Región: GRU (São Paulo)
  - serverExternalPackages: ['xlsx']  ← SheetJS requiere Node runtime
```

---

## Arquitectura

- **Server Components** por defecto en todas las vistas de datos
- **Client Components** solo en: DropZone, ExcelPreview, TimelineGantt,
  CostoChart, AvanceLineChart, RutaPlanner, modales, formularios RHF
- **Server Actions** para: parsear Excel, registrar avance, mover personal,
  guardar ruta semanal
- **API Route** `/api/excel/upload` con `formData()` para recibir binario
- **Paginación cursor-based** en tablas de unidades e ítems
- **Optimistic updates** en avanzar etapa y mover personal
- **Middleware NextAuth** protege todas las rutas
  - Supervisor: solo puede ver sus proyectos asignados y gestionar su ruta
  - Coordinador: gestión completa excepto admin
  - Admin: acceso total
- **Error boundaries** por módulo

---

## Entregables Esperados

1. Repositorio Next.js con estructura App Router completa
2. `prisma/schema.prisma` + `prisma/seed.ts`
3. `tailwind.config.ts` con todos los tokens Formatto
4. `lib/excel/` con parsers para Cocina, Closet Interior y Piernas
5. `components/` con todos los componentes listados
6. `.env.example` con variables documentadas
7. `README.md` con setup local, seed, deploy en Vercel y estructura

---

## Base de Datos — Supabase

Reemplaza Vercel Postgres por **Supabase** como proveedor de base de datos:

```
Variables de entorno adicionales (.env.example):
  DATABASE_URL=             # postgresql://...@db.<ref>.supabase.co:5432/postgres
  DIRECT_URL=               # postgresql://...@db.<ref>.supabase.co:5432/postgres
                            # (DIRECT_URL requerido por Prisma para migraciones)
  NEXT_PUBLIC_SUPABASE_URL= # https://<ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY= # clave pública anon

prisma/schema.prisma:
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
```

**Supabase Storage** reemplaza Vercel Blob para archivos Excel:
- Bucket: `excel-uploads` (privado)
- Acceso vía signed URLs generadas en Server Actions
- Máximo 50MB por archivo

**No usar** Supabase Auth — mantener NextAuth.js como capa de autenticación,
conectado a Supabase PostgreSQL como adaptador de sesiones (NextAuth Prisma Adapter).

---

## Roles del Equipo de Desarrollo

### Claude Code — Arquitecto Líder y Revisor

Claude Code tiene **tres responsabilidades** en este proyecto:

**1. Planificar** (modo plan, al inicio)
Antes de que Codex escriba una sola línea de código, Claude Code genera
el plan completo de desarrollo en fases usando `claude --plan`.
El plan define tareas atómicas, orden de dependencias y criterios
de aceptación por fase.

**2. Tocar código cuando lo decide** (decisiones de arquitectura)
Claude Code puede y debe escribir código cuando se trata de decisiones
arquitectónicas: estructura de carpetas, configuración de Supabase/Prisma,
setup de NextAuth, middleware, convenciones base, patrones reutilizables.
Si Claude Code establece una base de código, Codex la sigue sin modificarla.

**3. Revisar** (después de cada entrega de Codex)
Cuando Codex completa una fase, Claude Code revisa el resultado:
valida arquitectura, criterios de aceptación y coherencia con el plan.
Aprueba o indica ajustes — que puede implementar él mismo si son
decisiones de arquitectura, o delegar a Codex si son implementación.

**Instrucción para Claude Code al iniciar:**
```
Eres el arquitecto líder de este proyecto. Tu rol:
1. AHORA: genera el plan completo en fases en modo --plan.
   Tareas atómicas, dependencias claras, criterios de aceptación.
2. CUANDO LO DECIDAS: escribe o modifica código de arquitectura
   (estructura, configuraciones, patrones base, middleware).
   Lo que tú escribas es la referencia — Codex no lo modifica sin tu aprobación.
3. DESPUÉS DE CADA FASE: revisa lo que entregó Codex.
   Aprueba, ajusta tú mismo si es arquitectura, o delega correcciones a Codex.
```

### Codex — Ejecutor de Código

Codex es el único que escribe y ejecuta código. Opera fase por fase
siguiendo estrictamente el plan de Claude Code:

- **Solo implementa lo que el plan aprobado indica** — sin decisiones de arquitectura
- **Una fase a la vez** — no avanza sin aprobación de Claude Code
- **Reporta bloqueos** antes de improvisar soluciones
- **Escribe tests** por módulo antes de marcar tarea como completa
- **Formato de entrega obligatorio por fase:**
  ```
  ✅ FASE [N] COMPLETADA: [nombre]
  Archivos creados/modificados: [lista]
  Tests: [pasando / fallando]
  → Listo para revisión de Claude Code
  ```

### Flujo de trabajo

```
Claude Code — modo plan
  ↓ genera plan completo en fases
  ↓ [opcional] escribe código base de arquitectura (estructura, config, middleware)
  ↓ usuario aprueba el plan
Codex
  ↓ ejecuta Fase 1 sobre la base que dejó Claude Code
  ↓ entrega reporte ✅
Claude Code — revisión
  ↓ revisa arquitectura y criterios de aceptación
  ↓ APRUEBA → Codex ejecuta Fase 2
  ↓ AJUSTE DE ARQUITECTURA → Claude Code lo corrige directamente
  ↓ AJUSTE DE IMPLEMENTACIÓN → Codex corrige → Claude Code re-revisa
      (ciclo hasta completar todas las fases)
```

---

## Plan Inicial que Claude Code debe generar (estructura esperada)

Claude Code debe producir un plan con esta estructura mínima al iniciarse
en modo plan:

```markdown
# Plan de Desarrollo — Formatto Dashboard

## Fase 0 — Setup y Arquitectura Base
Tareas: [ ] init Next.js 14, [ ] configurar Supabase,
        [ ] Prisma schema completo, [ ] NextAuth + roles,
        [ ] tokens Formatto en Tailwind, [ ] estructura de carpetas
Criterio de aceptación: app corre en local, DB conectada, login funcional

## Fase 1 — Módulo de Proyectos y Carga Excel
Tareas: [ ] CRUD proyectos, [ ] DropZone, [ ] parsers Cocina/Closet/Piernas,
        [ ] preview antes de confirmar, [ ] persistencia en Supabase
Criterio de aceptación: se puede cargar un Excel real y ver los datos en BD

## Fase 2 — Módulo de Dotación
Tareas: [ ] modelo Personal/Asignacion/Evaluacion, [ ] tabla dotación,
        [ ] mover personal entre proyectos, [ ] evaluación 1-5,
        [ ] carga desde Excel de dotación
Criterio de aceptación: dotación visible por proyecto, movimientos registrados

## Fase 3 — Línea de Tiempo y Costos
Tareas: [ ] Gantt de asignaciones (Recharts), [ ] gráfico costo mensual,
        [ ] avance de obra con registro histórico
Criterio de aceptación: gráficos renderizan con datos reales del seed

## Fase 4 — Rutas de Visita Semanal
Tareas: [ ] modelo RutaVisita/Parada, [ ] planificador drag & drop,
        [ ] copiar semana anterior, [ ] exportar PDF ruta
Criterio de aceptación: supervisor puede planificar y exportar su semana

## Fase 5 — Seguimiento de Instalación por Unidad
Tareas: [ ] pipeline por ítem (5 etapas), [ ] avanzar etapa,
        [ ] galería de fotos (Supabase Storage), [ ] historial de cambios
Criterio de aceptación: se puede avanzar un ítem de PEDIDO a ENTREGA CONFORME

## Fase 6 — Reportes y Dashboard Global
Tareas: [ ] StatCards globales, [ ] gráfico avance multi-proyecto,
        [ ] acta de conformidad PDF, [ ] reporte de dotación PDF
Criterio de aceptación: reportes exportan con header Formatto correcto

## Fase 7 — Polish y Deploy
Tareas: [ ] loading skeletons, [ ] error boundaries, [ ] tests E2E,
        [ ] variables de entorno Vercel, [ ] deploy a producción
Criterio de aceptación: app desplegada y funcional en dominio Formatto
```
