"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input } from "@/components/ui/FormField";

const CATEGORIAS = ["COCINA", "CLOSET", "ADICIONAL", "INSTALACION", "OTRO"] as const;
type Categoria = (typeof CATEGORIAS)[number];

type Linea = {
  categoria: Categoria;
  tipologia: string;
  descripcion: string;
  cantidad: string;
  valorUnitario: string;
  valorUnitarioUF: string;
};

export type VentaInicial = {
  fecha: string | null;
  valorUF: number | null;
  clienteContacto: string | null;
  clienteCorreo: string | null;
  clienteTelefono: string | null;
  pdfUrl: string | null;
  lineas: {
    categoria: Categoria;
    tipologia: string | null;
    descripcion: string | null;
    cantidad: number;
    valorUnitario: number;
    valorUnitarioUF: number | null;
  }[];
};

type VentaFormProps = {
  proyectoId: string;
  inicial: VentaInicial | null;
};

function lineaVacia(categoria: Categoria = "COCINA"): Linea {
  return { categoria, tipologia: "", descripcion: "", cantidad: "", valorUnitario: "", valorUnitarioUF: "" };
}

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export function VentaForm({ proyectoId, inicial }: VentaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [fecha, setFecha] = useState(inicial?.fecha ?? "");
  const [valorUF, setValorUF] = useState(inicial?.valorUF?.toString() ?? "");
  const [contacto, setContacto] = useState(inicial?.clienteContacto ?? "");
  const [correo, setCorreo] = useState(inicial?.clienteCorreo ?? "");
  const [telefono, setTelefono] = useState(inicial?.clienteTelefono ?? "");
  const [pdf, setPdf] = useState<File | null>(null);
  const [extrayendo, setExtrayendo] = useState(false);

  const [lineas, setLineas] = useState<Linea[]>(
    inicial && inicial.lineas.length > 0
      ? inicial.lineas.map((l) => ({
          categoria: l.categoria,
          tipologia: l.tipologia ?? "",
          descripcion: l.descripcion ?? "",
          cantidad: l.cantidad.toString(),
          valorUnitario: l.valorUnitario.toString(),
          valorUnitarioUF: l.valorUnitarioUF?.toString() ?? "",
        }))
      : [lineaVacia()]
  );

  async function extraerDelPdf(file: File) {
    setExtrayendo(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await fetch(`/api/proyectos/${proyectoId}/venta/extraer`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No fue posible leer el PDF.");

      // Pre-llenar cabecera (sin pisar lo que el usuario ya escribió).
      if (json.fecha && !fecha) setFecha(json.fecha);
      if (json.valorUF && !valorUF) setValorUF(String(json.valorUF));
      if (json.clienteContacto && !contacto) setContacto(json.clienteContacto);
      if (json.clienteCorreo && !correo) setCorreo(json.clienteCorreo);
      if (json.clienteTelefono && !telefono) setTelefono(json.clienteTelefono);

      // Pre-llenar líneas (reemplaza la tabla para revisión).
      setLineas(
        json.lineas.map((l: VentaInicial["lineas"][number]) => ({
          categoria: l.categoria,
          tipologia: l.tipologia ?? "",
          descripcion: l.descripcion ?? "",
          cantidad: l.cantidad.toString(),
          valorUnitario: l.valorUnitario.toString(),
          valorUnitarioUF: l.valorUnitarioUF?.toString() ?? "",
        }))
      );
      setMessage(`Se extrajeron ${json.lineas.length} líneas del PDF. Revísalas y guarda.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No fue posible leer el PDF.");
    } finally {
      setExtrayendo(false);
    }
  }

  function actualizar(idx: number, campo: keyof Linea, valor: string) {
    setLineas((curr) => curr.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }
  function agregar() {
    setLineas((curr) => [...curr, lineaVacia(curr[curr.length - 1]?.categoria ?? "COCINA")]);
  }
  function eliminar(idx: number) {
    setLineas((curr) => (curr.length > 1 ? curr.filter((_, i) => i !== idx) : curr));
  }

  function totalLinea(l: Linea) {
    const c = parseFloat(l.cantidad) || 0;
    const v = parseFloat(l.valorUnitario) || 0;
    return c * v;
  }
  function totalLineaUF(l: Linea) {
    const c = parseFloat(l.cantidad) || 0;
    const v = parseFloat(l.valorUnitarioUF) || 0;
    return c * v;
  }
  const totalCLP = lineas.reduce((s, l) => s + totalLinea(l), 0);
  const totalUF = lineas.reduce((s, l) => s + totalLineaUF(l), 0);

  function guardar() {
    setMessage(null);
    startTransition(async () => {
      try {
        const data = {
          fecha: fecha || null,
          valorUF: parseFloat(valorUF) || null,
          clienteContacto: contacto || null,
          clienteCorreo: correo || null,
          clienteTelefono: telefono || null,
          lineas: lineas
            .filter((l) => l.cantidad || l.valorUnitario || l.tipologia)
            .map((l) => ({
              categoria: l.categoria,
              tipologia: l.tipologia || null,
              descripcion: l.descripcion || null,
              cantidad: parseInt(l.cantidad, 10) || 0,
              valorUnitario: parseFloat(l.valorUnitario) || 0,
              valorUnitarioUF: l.valorUnitarioUF ? parseFloat(l.valorUnitarioUF) : null,
            })),
        };
        const fd = new FormData();
        fd.append("data", JSON.stringify(data));
        if (pdf) fd.append("pdf", pdf);

        const res = await fetch(`/api/proyectos/${proyectoId}/venta`, { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No fue posible guardar.");
        setMessage("Cotización guardada.");
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "No fue posible guardar.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Cabecera comercial */}
      <section className="bg-white border border-border p-6">
        <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-4">Datos comerciales</p>
        <div className="grid grid-cols-3 gap-4">
          <FieldWrap label="Contacto cliente"><Input value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Nombre" /></FieldWrap>
          <FieldWrap label="Correo"><Input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="correo@cliente.cl" /></FieldWrap>
          <FieldWrap label="Teléfono"><Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 ..." /></FieldWrap>
          <FieldWrap label="Fecha cotización"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></FieldWrap>
          <FieldWrap label="Valor UF"><Input type="number" step="0.001" value={valorUF} onChange={(e) => setValorUF(e.target.value)} placeholder="39486" /></FieldWrap>
          <FieldWrap label="PDF cotización — extrae los datos">
            <input
              type="file"
              accept="application/pdf"
              disabled={extrayendo}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setPdf(f);
                if (f) void extraerDelPdf(f);
              }}
              className="block w-full text-sm text-formatto-umber file:mr-3 file:border file:border-border file:bg-white file:px-3 file:py-1.5 file:text-2xs file:font-semibold file:uppercase file:tracking-widest"
            />
          </FieldWrap>
        </div>
        <p className="text-2xs text-formatto-bark mt-2">
          {extrayendo
            ? "Leyendo el PDF…"
            : "Sube el PDF de la cotización y se completarán los datos automáticamente para que solo revises."}
          {inicial?.pdfUrl && !extrayendo && <> · PDF guardado: {inicial.pdfUrl.split("/").pop()}</>}
        </p>
      </section>

      {/* Líneas de precio */}
      <section className="border border-border bg-white">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Líneas de precio</p>
          <Button type="button" variant="secondary" size="sm" onClick={agregar}>+ Agregar línea</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-2xs uppercase tracking-widest text-formatto-bark">
                <th className="text-left p-2 font-semibold">Categoría</th>
                <th className="text-left p-2 font-semibold">Tipología</th>
                <th className="text-right p-2 font-semibold">Cant.</th>
                <th className="text-right p-2 font-semibold">Valor unit. $</th>
                <th className="text-right p-2 font-semibold">Valor unit. UF</th>
                <th className="text-right p-2 font-semibold">Total $</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l, idx) => (
                <tr key={idx} className="border-b border-border/60">
                  <td className="p-2">
                    <select
                      value={l.categoria}
                      onChange={(e) => actualizar(idx, "categoria", e.target.value)}
                      className="h-9 w-full border border-input bg-background px-2 text-sm rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <Input value={l.tipologia} onChange={(e) => actualizar(idx, "tipologia", e.target.value)} placeholder="CO 01" className="h-9" />
                  </td>
                  <td className="p-2 w-20">
                    <Input type="number" min={0} value={l.cantidad} onChange={(e) => actualizar(idx, "cantidad", e.target.value)} className="h-9 text-right" />
                  </td>
                  <td className="p-2 w-32">
                    <Input type="number" min={0} value={l.valorUnitario} onChange={(e) => actualizar(idx, "valorUnitario", e.target.value)} className="h-9 text-right" />
                  </td>
                  <td className="p-2 w-28">
                    <Input type="number" min={0} step="0.01" value={l.valorUnitarioUF} onChange={(e) => actualizar(idx, "valorUnitarioUF", e.target.value)} className="h-9 text-right" />
                  </td>
                  <td className="p-2 text-right font-semibold text-formatto-grafito whitespace-nowrap">{CLP.format(totalLinea(l))}</td>
                  <td className="p-2 text-right">
                    <button type="button" onClick={() => eliminar(idx)} className="text-primary text-xs" aria-label="Eliminar línea">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="p-2 text-2xs font-semibold uppercase tracking-widest text-formatto-bark" colSpan={5}>Total</td>
                <td className="p-2 text-right font-bold text-formatto-grafito whitespace-nowrap">
                  {CLP.format(totalCLP)}
                  {totalUF > 0 && <span className="block text-2xs font-semibold text-formatto-bark">{totalUF.toFixed(2)} UF</span>}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {message && <div className="bg-white border border-border p-3 text-sm text-formatto-umber">{message}</div>}

      <div className="flex justify-end">
        <Button type="button" variant="primary" loading={isPending} onClick={guardar}>Guardar cotización</Button>
      </div>
    </div>
  );
}
