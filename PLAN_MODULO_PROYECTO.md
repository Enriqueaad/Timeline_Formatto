# PLAN COMPLETO — Módulo Proyectos · Formatto Dashboard

Eres el arquitecto líder de este proyecto. Entra en modo --plan.
No escribas código aún. Genera el plan completo en fases para el 
módulo Proyectos, con tareas atómicas, dependencias y criterios 
de aceptación por fase. Codex ejecutará cada fase. Tú revisas.

---

## Contexto de la aplicación

App Next.js 14 (App Router) + Supabase + Prisma + NextAuth.
Formatto es una empresa que fabrica e instala muebles (cocina, 
closet, piernas) en proyectos inmobiliarios de constructoras clientes.
El módulo Proyectos es el núcleo de toda la aplicación.

La app ya está corriendo en localhost:3000 con estructura base,
seed de datos y los siguientes módulos parcialmente implementados.

---

## Estado actual (lo que ya existe)

✅ Sidebar Formatto con navegación completa
✅ /proyectos — listado con tabla, estados, botón "Cargar Excel"
✅ /proyectos/[id] — detalle con StatCards + form edición inline
✅ /proyectos/[id]/unidades — tabla Piso·Dpto·Torre·Tipo·Items·Etapa
✅ /proyectos/[id]/carga — DropZone UI (sin parser real conectado)
✅ /proyectos/[id]/unidades/[unidadId] — página existe pero rota

❌ "Ver detalle" en tabla de unidades no navega correctamente
❌ Detalle de unidad muestra "Unidad no encontrada" para cualquier ID
❌ Parser Excel real no conectado (datos son solo seed)
❌ Recetas de items no implementadas
❌ Detección y confirmación de torres al cargar Excel
❌ Preview de datos antes de confirmar carga

---

## Archivos Excel reales del proyecto VIVE QUINTA (TASCO)

El proyecto tiene 3 tipos de Excel. Pueden subirse juntos o separados.

### TIPO 1 — Cocina
Archivo: BD_COCINA_GOLA_-_TASCO_VIVE_QUINTA_v6_qc_actualizada.xlsx
Hoja a leer: NV_RTA
Headers en fila 1:
  Recuento · SKU · Descripcion · Fabricante · Categoría · 
  Sección Tira · Kit · Orientacion · Orientación/Medida · 
  Piso · Departamento · Tipo Cocina · Subconjunto
Agrupación: (Piso, Departamento) → 1 Unidad
Cada fila dentro del grupo → 1 ItemInstalacion tipo COCINA
Subconjuntos: BASE · MURAL · VARIOS · PUERTA_B · PUERTA_M · QC
Tipos de cocina: CO_1e · CO_2 · CO_2e · CO_3 · CO_3e · CO_4 · CO_5 etc.
Total: 7.620 filas · 150 departamentos · 8 pisos

Recetas: en hoja RECETA del mismo archivo
  Relación: NV_RTA.SKU → RECETA.SKU (columna índice 3, no 0)
  Columnas receta:
    TT_COD_MBL · TT_DESC_MBL · Tipo Mueble · SKU · Mueble ·
    SKU Material Pieza · Material Pieza · Color Pieza · Categoría ·
    Espesor · SKU Material Tapacanto · Material Tapacanto ·
    Descripcion Tapacanto · Color Tapacantos · Largo (A) · Ancho (B) ·
    Recuento · Sección Tira · Largo Tapacanto · Veta · Descripcion ·
    Código de Programa · Ranurado · Mecanizado · Perforado ·
    Enchape (A) · Enchape (B) · Área · Kit
  89 de 99 SKUs tienen receta. Los 10 restantes → receta vacía, no error.

### TIPO 2 — Closet Interior
Archivo: INTERIOR_CLOSET_PROYECTO_VIVE_QUINTA___TASCO.xlsm
Hoja a leer: CUADRO
IMPORTANTE: Headers en fila 3 (filas 1-2 vacías). Columna A siempre vacía.
Headers:
  [vacío] · PISO · DPTO · TIPO · FICHA · COD · MUEBLE · CANTIDAD ·
  CONJUNTO · SUB CONJUNTO · PROYECTO · COSTO · PIVOTE · TORRE
Agrupación: (PISO, DPTO) → 1 Unidad
SUB CONJUNTO distingue: INTERIOR · QUINC. (quincallería)
  → Tratar como categorías separadas en el dashboard
TORRE: campo presente pero en este proyecto tiene valores 0-9 
  que son códigos internos de diseño, NO torres físicas reales.
  Ver sección "Manejo de TORRE" más abajo.
Total: 2.229 filas · 150 departamentos

Recetas: en fichas individuales — archivos C01.xlsm a C28.xlsm
  Relación: CUADRO.FICHA → nombre del archivo de ficha
    Ej: FICHA=C13 → leer archivo C13__MALETERO_1170x530x18__...xlsm
  Hoja a leer en cada ficha: PLANTILLA_FLEXIBLE
  Headers en fila 17, datos desde fila 18, rango hasta fila 96
  Columnas clave (índice base 0, offset columna 70 = col BS):
    Col 71: PROYECTO · Col 72: LINEA · Col 73: TIPO DE MUEBLE
    Col 74: CANTIDAD A CONSTRUIR · Col 75: N°FICHA
    Col 76: PRODUCTO · Col 77: CODIGO SAP MUEBLE · Col 78: TIPO
    Col 79: COD MATERIAL · Col 80: DESCR MATERIAL · Col 81: MATERIAL
    Col 82: COLOR MATERIAL · Col 83: ESP MATERIAL
    Col 84: COD TAPACANTO · Col 85: DES TAPACANTO
    Col 86: ESPESOR TC · Col 87: COLOR TC
    Col 88: LARGO (VETA) · Col 89: B · Col 90: CANT UNI
    Col 91: VETA · Col 92: PIEZA/INSUMO · Col 93: COD PROG
  Datos del mueble en cabecera de PLANTILLA_FLEXIBLE:
    Fila 2  col 5:  Producto (nombre)
    Fila 3  col 5:  Color
    Fila 4  col 5:  Código SAP
    Fila 6  col 6:  Largo
    Fila 7  col 6:  Ancho
    Fila 8  col 6:  Espesor
    Fila 11 col 3:  Tipo Mueble
    Fila 11 col 6:  Conjunto
  Filtrar filas donde col 79 (COD MATERIAL) sea 0, null o '-'

### TIPO 3 — Piernas Closet
Archivo: PIERNAS_CLOSET_PROYECTO_VIVE_QUINTA___TASCO.xlsm
Hoja a leer: CUADRO
Misma estructura exacta que Closet Interior (headers fila 3)
SUB CONJUNTO: PIERNAS · QUINC.
Solo 42 dptos tienen piernas (no todos los departamentos)
Fichas: C25.xlsm a C28.xlsm — misma estructura PLANTILLA_FLEXIBLE

---

## Manejo del campo TORRE

Al parsear cualquier Excel con campo TORRE:
1. Detectar valores únicos del campo TORRE en el archivo
2. Antes de confirmar la carga, mostrar al usuario:
   "Se detectaron estos valores en el campo Torre: [lista]
    ¿Cuántas torres físicas tiene este proyecto?"
3. Usuario responde (ej: 1 para VIVE QUINTA)
4. Normalización:
   - Si 1 torre: TORRE = null para todos los registros
   - Si N torres: los valores del campo se usan como identificador
     de torre física (el usuario confirma el mapeo si es necesario)

---

## Modelo de datos (Prisma)

model Proyecto {
  id              String    @id @default(cuid())
  nombre          String
  constructora    String
  torre           String?
  estado          EstadoProyecto @default(ACTIVO)
  fechaTermino    DateTime?
  observaciones   String?
  unidades        Unidad[]
  archivos        ArchivoExcel[]
  creadoEn        DateTime  @default(now())
}

model Unidad {
  id          String    @id @default(cuid())
  proyectoId  String
  proyecto    Proyecto  @relation(fields: [proyectoId], references: [id])
  piso        String
  codigo      String
  torre       String?
  tipo        String?
  estado      EstadoUnidad @default(PENDIENTE)
  items       ItemInstalacion[]
  @@unique([proyectoId, piso, codigo])
}

model ItemInstalacion {
  id            String    @id @default(cuid())
  unidadId      String
  unidad        Unidad    @relation(fields: [unidadId], references: [id])
  sku           String
  descripcion   String
  cantidad      Int       @default(1)
  tipoMueble    TipoMueble
  subconjunto   String?
  estado        EstadoItem @default(PEDIDO)
  receta        RecetaItem[]
  creadoEn      DateTime  @default(now())
}

model RecetaItem {
  id              String   @id @default(cuid())
  itemId          String
  item            ItemInstalacion @relation(fields: [itemId], references: [id])
  codMaterial     String
  descripMaterial String?
  material        String?
  colorMaterial   String?
  espesor         String?
  codTapacanto    String?
  descTapacanto   String?
  largo           Float?
  ancho           Float?
  cantUni         Float?
  veta            String?
  piezaInsumo     String?
  codPrograma     String?
}

model ArchivoExcel {
  id                 String      @id @default(cuid())
  proyectoId         String
  proyecto           Proyecto    @relation(fields: [proyectoId], references: [id])
  tipo               TipoArchivo
  nombreOriginal     String
  filasLeidas        Int
  unidadesDetectadas Int
  creadoPor          String
  creadoEn           DateTime    @default(now())
}

enum TipoArchivo    { COCINA CLOSET_INTERIOR PIERNAS }
enum TipoMueble     { COCINA CLOSET_INTERIOR PIERNAS QUINCALLERIA OTRO }
enum EstadoProyecto { ACTIVO TERMINADO PAUSADO CANCELADO }
enum EstadoUnidad   { PENDIENTE EN_PROCESO COMPLETADA CON_OBSERVACION }
enum EstadoItem     { PEDIDO FABRICACION DESPACHO INSTALACION ENTREGA_CONFORME }

---

## FASES DEL PLAN

---

### FASE 0 — Limpiar datos seed (manto blanco)

Antes de cualquier desarrollo, eliminar toda la data de prueba
para trabajar con la base de datos vacía y real.

Tareas:
[ ] Eliminar todos los registros seed respetando foreign keys,
    en este orden exacto:
      1. RecetaItem
      2. ItemInstalacion
      3. Unidad
      4. ArchivoExcel
      5. Proyecto
    Usar prisma.$transaction para hacerlo atómico.

[ ] Verificar que las tablas quedan vacías pero el schema intacto.

[ ] Actualizar prisma/seed.ts para que NO inserte proyectos
    ni unidades de prueba. Solo datos de autenticación:
    usuario admin y usuario coordinador.

[ ] Si existe algún script de seed automático en package.json
    que corra al iniciar el servidor, desactivarlo o condicionarlo
    para que no repopule la data.

Criterio de aceptación:
- /proyectos muestra tabla vacía sin errores
- /dashboard muestra KPIs en cero sin crashear
- La app sigue funcionando correctamente sin datos de proyectos
- El único seed que corre es el de usuarios de autenticación

---

### FASE 1 — Corregir detalle de unidad (bug crítico)

El link "Ver detalle" en la tabla de unidades no funciona.
La página /proyectos/[id]/unidades/[unidadId] muestra
"Unidad no encontrada" para cualquier ID.

Tareas:
[ ] Revisar los IDs reales de las unidades en la BD con Prisma
[ ] Revisar la página de detalle — cómo recibe [unidadId] y
    cómo hace el query a Prisma
[ ] Revisar el componente tabla de unidades — qué ID usa para
    construir el link "Ver detalle"
[ ] Identificar el desajuste entre el ID del link y el query
[ ] Corregir — puede ser en el query, en el link, o en ambos
[ ] Si el problema es sistémico (ej: ruta mal parametrizada,
    mismatch entre schema y query), corregirlo directamente

Criterio de aceptación:
- Desde /proyectos/[id]/unidades hacer click en "Ver detalle"
  navega correctamente a la unidad y muestra sus datos
- No aparece "Unidad no encontrada" para ninguna unidad válida

---

### FASE 2 — Schema y migración

Verificar que el schema Prisma refleja exactamente el modelo
de datos definido arriba. Ajustar diferencias. Migrar a Supabase.

Tareas:
[ ] Comparar schema actual vs modelo de datos de este documento
[ ] Ajustar modelos que difieran: campos faltantes, tipos incorrectos,
    relaciones mal definidas, enums incompletos
[ ] Verificar constraint @@unique([proyectoId, piso, codigo]) en Unidad
[ ] Generar y ejecutar migración en Supabase
[ ] Verificar en Supabase Studio que las tablas y relaciones
    quedaron correctas
[ ] Actualizar seed.ts: solo usuarios admin y coordinador,
    sin proyectos ni unidades de prueba

Criterio de aceptación:
- prisma migrate status sin pendientes
- Todas las tablas del modelo existen en Supabase con los campos correctos
- Los enums TipoArchivo, TipoMueble, EstadoProyecto, EstadoUnidad,
  EstadoItem existen en la BD
- seed.ts solo crea usuarios de auth, nada más

---

### FASE 3 — Parsers Excel

Implementar lib/excel/parsers/ con todos los parsers necesarios.
Los archivos Excel reales están disponibles en el proyecto para tests.

Tareas:

[ ] lib/excel/detector.ts
    Detecta tipo de archivo por hojas disponibles:
    - Tiene hoja NV_RTA → COCINA
    - Tiene hoja CUADRO → leer primera fila de datos para
      determinar si es CLOSET_INTERIOR o PIERNAS por SUB CONJUNTO
    - Ninguna de las anteriores → error con mensaje claro

[ ] lib/excel/parsers/cocina.ts
    Lee hoja NV_RTA
    - Headers en fila 1
    - Agrupa filas por (Piso, Departamento) → cada grupo = 1 Unidad
    - Cada fila del grupo → 1 ItemInstalacion tipo COCINA
    - Campos: recuento, sku, descripcion, tipoCocina, subconjunto
    - Devuelve: { unidades: UnidadParsed[], resumen: ResumenCarga }

[ ] lib/excel/parsers/cocina-receta.ts
    Lee hoja RECETA del mismo archivo de cocina
    - Headers en fila 1
    - Relación: NV_RTA.SKU → RECETA col índice 3 (campo SKU)
    - Por cada SKU de NV_RTA busca sus filas de receta
    - Si SKU no tiene receta → array vacío, no error
    - Devuelve: Map<sku, RecetaParsed[]>

[ ] lib/excel/parsers/closet.ts
    Lee hoja CUADRO de archivos .xlsm
    - IMPORTANTE: headers en fila 3 (índice 2), filas 1-2 vacías
    - Columna A (índice 0) siempre vacía — ignorar
    - Agrupa por (PISO, DPTO) → cada grupo = 1 Unidad
    - SUB CONJUNTO:
        'INTERIOR' → TipoMueble.CLOSET_INTERIOR
        'QUINC.'   → TipoMueble.QUINCALLERIA
        'PIERNAS'  → TipoMueble.PIERNAS
    - Campo TORRE: guardar valor raw, normalizar después
    - Funciona para tanto CLOSET_INTERIOR como PIERNAS
      (misma estructura, diferente SUB CONJUNTO dominante)
    - Devuelve: { unidades: UnidadParsed[], torresDetectadas: string[] }

[ ] lib/excel/parsers/ficha.ts
    Lee PLANTILLA_FLEXIBLE de archivos de ficha (C01.xlsm...C28.xlsm)
    - Datos del mueble en cabecera:
        fila 2 col 5:  nombre producto
        fila 3 col 5:  color
        fila 4 col 5:  código SAP
        fila 6 col 6:  largo
        fila 7 col 6:  ancho
        fila 8 col 6:  espesor
        fila 11 col 3: tipo mueble
        fila 11 col 6: conjunto
    - Receta: headers en fila 17 (índice 16), datos desde fila 18
      rango columnas: índice 70 (col BS) hasta índice 96
      Filtrar filas donde col 79 sea 0, null, '-' o vacío
    - Devuelve: { mueble: MuebleParsed, receta: RecetaParsed[] }

[ ] lib/excel/normalizador-torre.ts
    - Recibe valores únicos detectados del campo TORRE
    - Recibe cantidad de torres físicas confirmada por usuario
    - Si torresFisicas === 1 → retorna null para todos
    - Si torresFisicas > 1 → retorna mapa de valores a torres

[ ] Tests unitarios para cada parser
    Usar los archivos Excel reales del proyecto como fixtures
    Verificar:
    - Cocina: 150 unidades, 8 pisos, subconjuntos correctos
    - Closet: 150 unidades, SUB CONJUNTO distinguido correctamente
    - Piernas: 42 unidades (no todas tienen piernas)
    - Fichas: receta extraída correctamente para C02 (VERTICAL)

Criterio de aceptación:
- Todos los tests pasan con los archivos Excel reales
- Parser cocina genera exactamente 150 unidades desde NV_RTA
- Parser closet distingue INTERIOR de QUINC. correctamente
- Parser ficha extrae al menos 1 pieza real de PLANTILLA_FLEXIBLE
- Ningún parser lanza excepción con los archivos reales

---

### FASE 4 — API y Server Actions de carga

Conectar los parsers con la base de datos.

Tareas:

[ ] /api/excel/preview (POST)
    Recibe: FormData con archivo binario
    Proceso:
      1. Detectar tipo con detector.ts
      2. Parsear sin guardar en BD
      3. Si tiene campo TORRE: incluir torres_detectadas en respuesta
    Responde JSON:
    {
      tipo: TipoArchivo,
      unidades: number,
      items: number,
      torres_detectadas: string[],
      muestra: primeras 10 unidades con sus items
    }
    Manejo de errores: hoja no encontrada, formato incorrecto →
    respuesta con error descriptivo, no 500

[ ] Server Action: confirmarCargaExcel()
    Parámetros:
      proyectoId: string
      archivo: File
      torresConfirmadas: number  // cuántas torres físicas
    Proceso:
      1. Detectar tipo
      2. Parsear completo
      3. Normalizar torres según torresConfirmadas
      4. Verificar si proyecto ya tiene datos del mismo tipo
         → Si tiene: retornar { conflicto: true, tipo, existentes }
         → Si no: continuar
      5. Persistir en Supabase dentro de prisma.$transaction:
         - Crear/actualizar Unidades (upsert por proyectoId+piso+codigo)
         - Crear ItemInstalacion por cada item
         - Crear RecetaItem por cada pieza de receta
         - Crear registro ArchivoExcel
      6. Retornar { ok: true, unidades, items, recetas }

[ ] Server Action: resolverConflicto()
    Parámetros:
      proyectoId: string
      tipo: TipoArchivo
      accion: 'REEMPLAZAR' | 'AGREGAR'
      archivo: File
      torresConfirmadas: number
    REEMPLAZAR: eliminar items y unidades del mismo tipo, luego cargar
    AGREGAR: cargar sin eliminar (puede crear duplicados si mismo dpto)

[ ] Server Action: crearProyectoYCargar()
    Para el flujo de nuevo proyecto:
    Crea Proyecto + llama confirmarCargaExcel() en una sola operación

Criterio de aceptación:
- POST /api/excel/preview con el Excel real de cocina devuelve
  { tipo: 'COCINA', unidades: 150, items: ~7620 } en < 5 segundos
- confirmarCargaExcel() persiste las 150 unidades en Supabase
- Si se carga el mismo tipo dos veces, se detecta el conflicto
- La transacción es atómica: si falla a mitad, no quedan datos parciales

---

### FASE 5 — UI de carga y detalle de unidad completo

Conectar la UI existente con los Server Actions y completar
la vista de detalle de unidad.

Tareas UI de carga (/proyectos/[id]/carga):

[ ] Conectar DropZone al endpoint /api/excel/preview
    - Al soltar archivo: llamar preview automáticamente
    - Mostrar loading skeleton mientras parsea
    - Al recibir respuesta: mostrar ResumenPreview

[ ] Componente ResumenPreview
    Muestra antes de confirmar:
    - Tipo detectado (badge: COCINA / CLOSET INTERIOR / PIERNAS)
    - N° unidades detectadas · N° items · N° pisos
    - Tabla con primeras 10 unidades parseadas:
      Piso · Dpto · N° Items · Tipos de mueble
    - Si torres_detectadas.length > 1: mostrar ModalTorres

[ ] Componente ModalTorres
    "Se detectaron estos valores en el campo Torre: [lista]
     ¿Cuántas torres físicas tiene este proyecto?"
    Input numérico → confirmar
    Bloquea el botón "Confirmar carga" hasta que se responda

[ ] Botón "Confirmar carga"
    Llama confirmarCargaExcel() con archivo + torresConfirmadas
    Loading state durante la carga (puede demorar en proyectos grandes)
    Al terminar: redirect a /proyectos/[id]/unidades con toast de éxito

[ ] Componente ModalConflicto
    Si se detecta conflicto (mismo tipo ya cargado):
    "Este proyecto ya tiene datos de tipo [COCINA/CLOSET/PIERNAS].
     ¿Qué deseas hacer?"
    Opciones: Reemplazar · Agregar · Cancelar
    Reemplazar muestra advertencia: "Se eliminarán X unidades y X items"

Tareas detalle de unidad (/proyectos/[id]/unidades/[unidadId]):

[ ] Header de la unidad
    Piso · Código dpto · Torre (si existe) · Tipo · Estado (badge)

[ ] Items agrupados por TipoMueble
    Secciones separadas con eyebrow Formatto:
    "— COCINA" · "— CLOSET INTERIOR" · "— QUINCALLERÍA" · "— PIERNAS"
    Cada sección solo aparece si tiene items

[ ] Por cada item mostrar:
    SKU · Descripción · Cantidad · Subconjunto
    Pipeline visual de 5 etapas:
    PEDIDO → FABRICACIÓN → DESPACHO → INSTALACIÓN → ENTREGA CONFORME
    Etapa actual resaltada en Grafito, completadas en Sand,
    pendientes en Linen, con fechas si existen

[ ] Botón "Avanzar etapa"
    Modal de confirmación con fecha y observación opcional
    Server Action: avanzarEtapaItem()
    Optimistic update en la UI

[ ] Sección colapsable "Ver receta" por item
    Tabla de materiales:
    Código · Descripción · Material · Color · Espesor · Largo · Ancho · Cant.
    Si item no tiene receta: "Sin receta registrada" en Bark italic

Criterio de aceptación:
- Subir Excel real de VIVE QUINTA (cocina) desde la UI:
    → Preview muestra 150 unidades correctamente
    → Confirmar carga persiste todo en Supabase
    → Redirect a /unidades muestra las 150 unidades reales
- Click en cualquier unidad → detalle con sus items reales
- Items agrupados por tipo visualmente correctos
- "Avanzar etapa" de un item persiste el cambio y se refleja en UI
- "Ver receta" muestra los materiales del item si los tiene

---

## Criterios de aceptación globales

Al completar las 5 fases debe ser posible:

1. La app arranca con BD limpia — sin datos seed de proyectos
2. Crear un proyecto nuevo desde /proyectos
3. Subir el Excel real de VIVE QUINTA (cocina) desde "Cargar Excel"
4. Ver preview con 150 unidades antes de confirmar
5. Confirmar carga → 150 unidades persisten en Supabase
6. Navegar a /proyectos/[id]/unidades y ver las 150 unidades reales
7. Click en cualquier unidad → detalle con sus items y pipeline
8. Avanzar la etapa de un item y que persista
9. Ver la receta de un item de cocina con sus materiales
10. Subir también el Excel de closet → unidades se enriquecen
    con items de closet sin duplicar las unidades existentes

---

## Instrucción final para Claude Code

Genera el plan completo con:
- Subtareas atómicas por fase
- Orden de dependencias claro
- Archivos a crear o modificar por subtarea
- Criterio de aceptación por fase
- Checkpoint de revisión al final de cada fase

FASE 0 va primero, siempre.
No escribas código todavía. El plan primero.
Cuando el plan esté aprobado, Codex ejecuta fase por fase.
Tú revisas cada entrega antes de autorizar la siguiente.
Si en la revisión encuentras desvíos de arquitectura,
corrígelos tú directamente. Si son bugs de implementación,
descríbelos para que Codex los corrija.
