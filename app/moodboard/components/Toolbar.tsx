"use client";

import React, { useRef } from "react";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";

interface ToolbarProps {
  onSave: () => Promise<void> | void;
  onExport: () => Promise<void> | void;
  onAddText: () => void;
  onAddImageFromUrl: () => void;
  onAddImageFromFile: (file: File) => void;
  saving?: boolean;
}

export default function Toolbar({
  onSave,
  onExport,
  onAddText,
  onAddImageFromUrl,
  onAddImageFromFile,
  saving,
}: ToolbarProps) {
  const title = useMoodboardStore((s) => s.title);
  const setTitle = useMoodboardStore((s) => s.setTitle);
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImageFromFile(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-md border border-gray-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del moodboard"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <button
            type="button"
            onClick={() => undo()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={() => redo()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Rehacer
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-brand border border-brand hover:bg-brand/5"
          >
            Exportar
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddText}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Añadir texto
        </button>
        <button
          type="button"
          onClick={onAddImageFromUrl}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Añadir imagen por URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Subir imagen
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

