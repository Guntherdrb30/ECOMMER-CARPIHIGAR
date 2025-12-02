"use client";

import React from "react";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";

interface ToolbarProps {
  onSave: () => Promise<void> | void;
  onExport: () => Promise<void> | void;
  saving?: boolean;
}

export default function Toolbar({ onSave, onExport, saving }: ToolbarProps) {
  const title = useMoodboardStore((s) => s.title);
  const setTitle = useMoodboardStore((s) => s.setTitle);
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-md">
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
        <div className="mt-2 flex flex-wrap gap-2 md:mt-0">
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
            className="rounded-md border border-brand bg-white px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

