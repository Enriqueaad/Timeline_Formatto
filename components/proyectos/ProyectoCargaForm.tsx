"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DropZone } from "@/components/excel/DropZone";
import { ExcelPreview } from "@/components/excel/ExcelPreview";
import type { PreviewResponse, TipoExcel } from "@/lib/excel/types";

type ProyectoCargaFormProps = {
  proyectoId: string;
  proyectoNombre: string;
  tiposExistentes: TipoExcel[];
};

async function previewExcel(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/excel/preview", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "No fue posible previsualizar el archivo.");
  return data as PreviewResponse;
}

export function ProyectoCargaForm({ proyectoId, proyectoNombre, tiposExistentes }: ProyectoCargaFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const tipoRepetido = Boolean(preview && tiposExistentes.includes(preview.tipo));

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

  async function upload(modo: "reemplazar" | "agregar") {
    if (!file || !preview) return;
    setUploading(true);
    setConfirmOpen(false);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("proyectoId", proyectoId);
      form.append("modo", modo);
      form.append("cargadoPor", session?.user?.email ?? "sistema");
      const response = await fetch("/api/excel/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible cargar el archivo.");
      setMessage(`${data.unidades} unidades · ${data.items} items cargados`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible cargar el archivo.");
    } finally {
      setUploading(false);
    }
  }

  function confirmUpload() {
    if (!preview) return;
    if (tipoRepetido) {
      setConfirmOpen(true);
      return;
    }
    void upload("agregar");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border p-6">
        <p className="text-2xs font-semibold uppercase tracking-widest text-formatto-bark mb-2">Proyecto</p>
        <h2 className="text-xl font-light text-formatto-grafito">{proyectoNombre}</h2>
      </div>

      <DropZone onFile={handleFile} disabled={uploading} />
      <ExcelPreview data={preview} loading={previewLoading} />

      {message && <div className="bg-white border border-border p-4 text-sm text-formatto-umber">{message}</div>}

      <div className="flex justify-end">
        <Button type="button" onClick={confirmUpload} disabled={!file || !preview || uploading} loading={uploading}>
          Confirmar carga
        </Button>
      </div>

      {confirmOpen && preview && (
        <Dialog open onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ya existen datos de tipo {preview.tipo}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-formatto-umber">
              El proyecto ya tiene datos de este tipo. Elige si quieres reemplazar los datos anteriores o agregar nuevas unidades e items.
            </p>
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => upload("reemplazar")}>Reemplazar</Button>
              <Button type="button" variant="primary" onClick={() => upload("agregar")}>Agregar</Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
