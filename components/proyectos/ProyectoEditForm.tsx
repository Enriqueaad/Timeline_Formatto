"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Select, Textarea } from "@/components/ui/FormField";

const EditSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido"),
  constructora: z.string().optional(),
  torre: z.string().optional(),
  finEstimado: z.string().optional(),
  observacion: z.string().optional(),
  estado: z.enum(["ACTIVO", "PAUSADO", "TERMINADO", "CANCELADO"]),
});

type EditData = z.infer<typeof EditSchema>;

type ProyectoEditFormProps = {
  proyecto: {
    id: string;
    nombre: string;
    constructora: string | null;
    torre: string | null;
    finEstimado: string | null;
    observacion: string | null;
    estado: "ACTIVO" | "PAUSADO" | "TERMINADO" | "CANCELADO";
  };
};

export function ProyectoEditForm({ proyecto }: ProyectoEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<EditData>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      nombre: proyecto.nombre,
      constructora: proyecto.constructora ?? "",
      torre: proyecto.torre ?? "",
      finEstimado: proyecto.finEstimado ?? "",
      observacion: proyecto.observacion ?? "",
      estado: proyecto.estado,
    },
  });

  async function onSubmit(values: EditData) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible actualizar el proyecto.");
      setMessage("Proyecto actualizado.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white border border-border p-6 space-y-4">
      <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark">Editar proyecto</p>
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Nombre" error={form.formState.errors.nombre?.message}>
          <Input {...form.register("nombre")} />
        </FieldWrap>
        <FieldWrap label="Estado">
          <Select {...form.register("estado")}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="PAUSADO">PAUSADO</option>
            <option value="TERMINADO">TERMINADO</option>
            <option value="CANCELADO">CANCELADO</option>
          </Select>
        </FieldWrap>
        <FieldWrap label="Constructora">
          <Input {...form.register("constructora")} />
        </FieldWrap>
        <FieldWrap label="Torre">
          <Input {...form.register("torre")} />
        </FieldWrap>
        <FieldWrap label="Fin estimado">
          <Input type="date" {...form.register("finEstimado")} />
        </FieldWrap>
        <FieldWrap label="Observacion" className="col-span-2">
          <Textarea {...form.register("observacion")} />
        </FieldWrap>
      </div>
      {message && <p className="text-sm text-formatto-umber">{message}</p>}
      <div className="flex justify-end"><Button type="submit" loading={loading}>Guardar cambios</Button></div>
    </form>
  );
}
