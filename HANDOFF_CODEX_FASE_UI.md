# HANDOFF CODEX — FASE UI: Migración a shadcn/ui + estética blanca minimalista

> **Rol:** Claude (arquitecto) ya creó los primitivos y los **moldes de referencia**.
> Tú (Codex, ejecutor) **propagas el patrón** a los archivos listados copiando los moldes.
> No inventes estilos nuevos: copia exactamente el patrón de los moldes.

---

## Objetivo visual

Alinear la app a las webs de Formatto (formatto.cl / formattomodular.cl):
**blanco total, minimalista, líneas finas, tipografía liviana, acento naranja `#D35132`.**

### Reglas de estilo (OBLIGATORIAS)
1. **Nada de beige de relleno.** Reemplaza siempre:
   - `bg-formatto-cream` → `bg-white`
   - `border-formatto-sand` → `border-border`
   - `bg-formatto-linen` (zebra) → **eliminar** (sin zebra)
   - `text-formatto-rojo` → `text-primary`  ·  `bg-formatto-rojo` → `bg-primary`
2. **Tablas:** líneas finas, sin zebra. Usar los componentes `@/components/ui/table`.
3. **Modales:** migrar a `Dialog` de `@/components/ui/dialog`.
4. Mantén textos `formatto-grafito` / `formatto-umber` / `formatto-bark` (siguen válidos).
5. No cambies lógica de negocio, server actions, ni los tipos/props de los componentes.

---

## Primitivos disponibles (YA CREADOS — solo importar, no editar)

| Import | Componentes |
|---|---|
| `@/components/ui/table` | `Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell` |
| `@/components/ui/dialog` | `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter` |
| `@/components/ui/badge` | `Badge` |
| `@/components/ui/select` | `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` (shadcn, opcional) |
| `@/components/ui/textarea` | `Textarea` |
| `@/components/ui/Button` | `Button` (variants: `default`(naranja), `primary`(grafito), `secondary`, `destructive`, `ghost`, `outline`, `dark`, `link`; sizes: `sm`, `md`, `lg`) |
| `@/components/ui/FormField` | `FieldWrap, Input, Select, Textarea` (nativos, ya reestilizados con tokens) |
| `@/components/ui/punto` | `Punto` (cuadrito de marca) |

> **Nota Select:** los modales usan el `<Select>` nativo de `FormField`. **Mantenlo así**
> (no migres a shadcn Select salvo que se pida). Solo importa lo que ya usa cada archivo.

---

## MOLDE 1 — TABLAS  → ver `components/dotacion/DotacionTable.tsx`

Patrón a copiar:
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

<div className="border border-border bg-white">
  <Table>
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead>Columna</TableHead>
        <TableHead className="text-right">Numérica</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.length === 0 ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={N} className="p-8 text-center text-formatto-bark">Sin datos.</TableCell>
        </TableRow>
      ) : rows.map((row) => (
        <TableRow key={row.id}>
          <TableCell className="font-semibold text-formatto-grafito">{row.destacada}</TableCell>
          <TableCell>{row.normal}</TableCell>
          <TableCell className="text-right">{row.numero}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```
Reglas:
- **Quita el `index % 2` de zebra.** Ya no hay filas alternadas.
- `<TableHead>` ya trae estilo de header (mayúsculas, bark). No le pongas clases beige.
- Celda destacada (primera col): `className="font-semibold text-formatto-grafito"`.
- Celda numérica: `className="text-right"`.
- Para `<tfoot>` usa `TableFooter` (ej. costos): `<TableFooter><TableRow>...<TableCell>`.

### Archivos a migrar (tablas)
- `components/supervisores/SupervisoresTable.tsx`
- `app/(dashboard)/proyectos/[id]/unidades/page.tsx` (tabla de unidades)
- `app/(dashboard)/proyectos/[id]/unidades/[uid]/page.tsx` (tablas por subconjunto)
- `app/(dashboard)/costos/page.tsx` (incluye `TableFooter` para el total)

---

## MOLDE 2 — MODALES → ver `components/dotacion/PersonalModal.tsx`

Patrón a copiar (conserva TODA la lógica: useState por campo, useTransition, validación,
server action, `onClose()` al éxito):
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FieldWrap, Input, Select, Textarea } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

return (
  <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        {/* opcional: <DialogDescription>{subtitulo}</DialogDescription> */}
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Campo"><Input value={...} onChange={...} /></FieldWrap>
        {/* ...campos... */}
      </div>

      {error && <p className="text-primary text-sm">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="button" variant="primary" loading={isPending} onClick={submit}>Guardar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
```
Reglas:
- Elimina el viejo `<div className="fixed inset-0 ...">` y el `<button ...>x</button>`
  (el Dialog ya trae overlay, botón X, Escape y click-afuera).
- Si el modal tenía subtítulo (ej. el nombre de la persona), usa `DialogDescription`
  dentro de `DialogHeader`.
- Si tenía campo ancho (`col-span-2`), mantenlo en el `FieldWrap`.
- El error pasa de `text-formatto-rojo` a `text-primary`.

### Archivos a migrar (modales)
- `components/dotacion/EvaluarModal.tsx` (tiene subtítulo `nombre`, botones de nota 1-5 y `Textarea`)
- `components/dotacion/MoverPersonalModal.tsx` (subtítulo `nombre`, `grid-cols-2`)
- `components/dotacion/AvanceModal.tsx` (campo `Observacion` con `col-span-2`)
- `components/supervisores/SupervisorModal.tsx` (`grid-cols-2`)
- `components/proyectos/ProyectoCargaForm.tsx` → **modal inline** de confirmación
  (Reemplazar/Agregar/Cancelar). Migra ese bloque `fixed inset-0` a `Dialog`
  controlado por el estado `confirmOpen`:
  `<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>`.

> En los botones de nota 1-5 de `EvaluarModal`, cambia el activo
> `bg-formatto-grafito` se mantiene, pero el borde `border-formatto-sand` → `border-border`.

---

## MOLDE 3 — PÁGINAS (StatCards + secciones) → ver `app/(dashboard)/dotacion/page.tsx`

- `StatCard` ya es blanco automáticamente (no se toca su uso).
- Reemplaza cualquier wrapper/section con beige por blanco:
  `bg-formatto-cream` → `bg-white`, `border-formatto-sand` → `border-border`.
- Cajas de error/aviso: `bg-white border border-border text-formatto-umber`
  (texto de error en `text-primary` si es error).

### Archivos a revisar (páginas)
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/costos/page.tsx`
- `app/(dashboard)/dotacion/[proyectoId]/page.tsx`
- `app/(dashboard)/proyectos/[id]/unidades/page.tsx`
- `app/(dashboard)/proyectos/[id]/page.tsx`
- `app/(dashboard)/proyectos/page.tsx`
- Cualquier `<select>` de filtros con clases beige inline → `border-border bg-white`.

---

## GRÁFICOS (solo color) 

Cambia colores de barras/líneas/celdas a la paleta de marca:
- Naranja primario: `#D35132`  ·  Grafito: `#2B2B2B`
- Archivos: `components/dashboard/DashboardCharts.tsx` (ya usa `#CE4620` → cambiar a
  `#D35132`), `components/dotacion/CostoChart.tsx`, `components/dotacion/AvanceChart.tsx`,
  `components/dotacion/AsignacionGantt.tsx`.

---

## FORMULARIOS (verificar, casi sin cambios)

`ProyectoCreateForm.tsx` y `ProyectoEditForm.tsx` ya heredan el nuevo look vía
`FormField`. Solo reemplaza wrappers `bg-formatto-cream`/`border-formatto-sand` de las
`<section>` por `bg-white`/`border-border`.

---

## NO TOCAR
- `components/ui/*` ya migrados (table, badge, dialog, select, textarea, Button, input,
  label, card, punto, StatCard, EtapaBadge, EvaluacionBadge, FormField, LoadingSkeleton).
- `lib/actions/*`, `prisma/schema.prisma`, `auth.ts`, `lib/prisma.ts`.
- `tailwind.config.ts`, `app/globals.css` (tokens ya definidos).
- `components/layout/Sidebar.tsx`, `app/login/page.tsx`, `components/layout/PageHeader.tsx`
  (ya hechos por Claude).

---

## VERIFICACIÓN (antes de devolver)
1. `npx tsc --noEmit` → sin errores.
2. `npm run build` → sin errores.
3. `npm run dev` y con sesión iniciada (`enrique.arenas@formatto.cl` / `formatto2026`)
   recorrer: `/dashboard`, `/dotacion`, `/dotacion/[proyectoId]`, `/proyectos`,
   `/proyectos/[id]/unidades`, `/proyectos/[id]/unidades/[uid]`, `/supervisores`,
   `/costos`.
4. Confirmar: **cero beige de relleno**, tablas de líneas finas sin zebra, modales
   abren/cierran con Escape + click-afuera + X, acento `#D35132`.
5. Listar en tu reporte final los archivos modificados.

→ Al terminar, Claude hará la revisión final (FASE UI-3).
