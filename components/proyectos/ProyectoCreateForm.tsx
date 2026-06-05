"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FieldWrap, Input, Textarea } from "@/components/ui/FormField";
import { DropZone } from "@/components/excel/DropZone";
import { ExcelPreview } from "@/components/excel/ExcelPreview";
import type { PreviewResponse } from "@/lib/excel/types";

const ProyectoFormSchema = z.object({
  nombre: z.string().min(3, "Nombre requerido"),
  constructora: z.string().optional(),
  torre: z.string().optional(),
  finEstimado: z.string().optional(),
  observacion: z.string().optional(),
});

type ProyectoFormData = z.infer<typeof ProyectoFormSchema>;

async function previewExcel(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/excel/preview", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "No fue posible previsualizar el archivo.");
  return data as PreviewResponse;
}

export function ProyectoCreateForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<ProyectoFormData>({
    resolver: zodResolver(ProyectoFormSchema),
    defaultValues: { nombre: "", constructora: "", torre: "", finEstimado: "", observacion: "" },
  });

  async function handleFile(nextFile: File) {
    setFile(nextFile);
    setPreview(null);
    setMessage(null);
    setPreviewLoading(true);
    try {
      setPreview(await previewExcel(nextFile));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible leer el archivo.");
    } finally {
      setPreviewLoading(false);
    }
  }

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

      if (file && preview) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("proyectoId", data.proyecto.id);
        uploadForm.append("modo", "agregar");
        uploadForm.append("cargadoPor", session?.user?.email ?? "sistema");
        const upload = await fetch("/api/excel/upload", { method: "POST", body: uploadForm });
        const uploadData = await upload.json();
        if (!upload.ok) throw new Error(uploadData.error ?? "Proyecto creado, pero fallo la carga Excel.");
      }

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
          <FieldWrap label="Torre">
            <Input {...form.register("torre")} placeholder="Torre" />
          </FieldWrap>
          <FieldWrap label="Fin estimado">
            <Input type="date" {...form.register("finEstimado")} />
          </FieldWrap>
          <FieldWrap label="Observacion" className="col-span-2">
            <Textarea {...form.register("observacion")} placeholder="Notas internas del proyecto" />
          </FieldWrap>
        </div>
      </section>

      <section className="space-y-4">
        <DropZone onFile={handleFile} disabled={submitting} />
        <ExcelPreview data={preview} loading={previewLoading} />
      </section>

      {message && <div className="bg-white border border-border p-4 text-sm text-primary">{message}</div>}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={submitting}>Crear proyecto</Button>
      </div>
    </form>
  );
}
