"use client";

import { useRef, useState } from "react";

type DropZoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file?: File) {
    if (!file || disabled) return;
    onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
      className={`border border-dashed p-8 rounded-none bg-formatto-cream text-center cursor-pointer transition-colors ${
        dragging ? "border-formatto-grafito" : "border-formatto-sand"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm"
        hidden
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <p className="text-sm font-semibold text-formatto-grafito">
        Arrastra tu archivo Excel aqui · o haz clic para seleccionar
      </p>
      <p className="mt-2 text-xs text-formatto-bark">
        Formatos: .xlsx (Cocina) · .xlsm (Closet / Piernas)
      </p>
    </div>
  );
}
