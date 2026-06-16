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
  const [torresConfirmadas, setTorresConfirmadas] = useState<number | null>(null);

  const tipoRepetido = Boolean(preview && tiposExistentes.includes(preview.tipo));
  // Si el Excel trae más de un valor en el campo TORRE, el usuario debe confirmar
  // cuántas torres físicas tiene el proyecto antes de cargar.
  const requiereTorres = Boolean(preview && preview.torres_detectadas.length > 1);
  const torresOk = !requiereTorres || (torresConfirmadas !== null && torresConfirmadas >= 1);

  async function handleFile(nextFile: File) {
    setFile(nextFile);
    setPreview(null);
    setMessage(null);
    setTorresConfirmadas(null);
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
      form.append("torresConfirmadas", String(torresConfirmadas ?? 1));
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

      {requiereTorres && preview && (
        <div className="bg-white border border-amber-300 p-4 space-y-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-amber-700 mb-1">Confirmación de torres</p>
            <p className="text-sm text-formatto-umber">
              Se detectaron estos valores en el campo Torre:{" "}
              <span className="font-semibold text-formatto-grafito">{preview.torres_detectadas.join(", ")}</span>.
              ¿Cuántas torres físicas tiene este proyecto?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={torresConfirmadas ?? ""}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setTorresConfirmadas(Number.isFinite(n) && n >= 1 ? n : null);
              }}
              placeholder="N°"
              className="h-10 w-24 rounded-sm border border-input bg-background px-3 text-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-2xs text-formatto-bark">
              {torresConfirmadas === 1
                ? "1 torre → el campo Torre se guardará vacío."
                : torresConfirmadas && torresConfirmadas > 1
                  ? `${torresConfirmadas} torres → se conservará el valor del campo como identificador.`
                  : "Ingresa un número para continuar."}
            </span>
          </div>
        </div>
      )}

      {message && <div className="bg-white border border-border p-4 text-sm text-formatto-umber">{message}</div>}

      <div className="flex justify-end">
        <Button type="button" onClick={confirmUpload} disabled={!file || !preview || uploading || !torresOk} loading={uploading}>
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
