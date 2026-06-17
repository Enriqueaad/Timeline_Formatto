"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input } from "@/components/ui/FormField";

// Creación mínima (etapa 1 del onboarding): solo identidad. La estructura (Excel),
// venta/presupuesto y definiciones operativas se completan en etapas posteriores
// desde el detalle del proyecto.
const ProyectoFormSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido"),
  constructora: z.string().optional(),
});

type ProyectoFormData = z.infer<typeof ProyectoFormSchema>;

export function ProyectoCreateForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<ProyectoFormData>({
    resolver: zodResolver(ProyectoFormSchema),
    defaultValues: { nombre: "", constructora: "" },
  });

  async function onSubmit(values: ProyectoFormData) {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible crear el proyecto.");

      // Al hub del proyecto, que guía las siguientes etapas (cargar Excel, venta, definiciones).
      router.push(`/proyectos/${data.proyecto.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <section className="bg-white border border-border p-6">
        <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-4">Datos del proyecto</p>
        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Nombre" error={form.formState.errors.nombre?.message}>
            <Input {...form.register("nombre")} placeholder="Nombre del proyecto" />
          </FieldWrap>
          <FieldWrap label="Constructora">
            <Input {...form.register("constructora")} placeholder="Constructora" />
          </FieldWrap>
        </div>
        <p className="text-2xs text-formatto-bark mt-4">
          Luego de crear el proyecto podrás cargar el Excel, la información de venta y las definiciones operativas.
        </p>
      </section>

      {message && <div className="bg-white border border-border p-4 text-sm text-primary">{message}</div>}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={submitting}>Crear proyecto</Button>
      </div>
    </form>
  );
}
