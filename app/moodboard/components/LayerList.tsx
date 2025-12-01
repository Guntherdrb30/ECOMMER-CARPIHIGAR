"use client";

import React from "react";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

interface LayerListProps {
  className?: string;
}

export default function LayerList({ className }: LayerListProps) {
  const elements = useMoodboardStore((s) => s.elements);
  const selectedElementId = useMoodboardStore((s) => s.selectedElementId);
  const setSelectedElement = useMoodboardStore((s) => s.setSelectedElement);
  const bringToFront = useMoodboardStore((s) => s.bringToFront);
  const sendToBack = useMoodboardStore((s) => s.sendToBack);
  const lockElement = useMoodboardStore((s) => s.lockElement);
  const unlockElement = useMoodboardStore((s) => s.unlockElement);
  const removeElement = useMoodboardStore((s) => s.removeElement);
  const updateElement = useMoodboardStore((s) => s.updateElement);

  const handleToggleLock = (el: MoodboardElement) => {
    if (el.locked) {
      unlockElement(el.id);
    } else {
      lockElement(el.id);
    }
  };

  const handleRotate = (el: MoodboardElement, delta: number) => {
    updateElement(el.id, { rotation: el.rotation + delta });
  };

  const handleTextChange = (el: MoodboardElement, value: string) => {
    updateElement(el.id, { data: { ...el.data, textContent: value } });
  };

  return (
    <aside
      className={`relative z-20 flex h-full flex-col rounded-xl bg-white p-4 shadow-md border border-gray-200 ${className ?? ""}`}
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-800">Capas</h2>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {elements.length === 0 && (
          <p className="text-xs text-gray-500">
            Aún no hay elementos en el moodboard.
          </p>
        )}
        {elements
          .map((el, index) => ({ el, index }))
          .reverse()
          .map(({ el, index }) => {
            const isSelected = el.id === selectedElementId;
            const label =
              el.type === "product"
                ? el.data.name || "Producto"
                : el.type === "image"
                  ? "Imagen"
                  : "Texto";
            return (
              <div
                key={el.id}
                className={`rounded-lg border p-2 text-xs ${
                  isSelected
                    ? "border-brand bg-brand/5"
                    : "border-gray-200 bg-gray-50 hover:border-brand/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedElement(el.id)}
                    className="flex-1 text-left"
                  >
                    <p className="truncate font-semibold text-gray-800">
                      {label}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {el.type.toUpperCase()} • #{elements.length - index}
                    </p>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(el)}
                      className="rounded border border-gray-300 px-1 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                    >
                      {el.locked ? "🔒" : "🔓"}
                    </button>
                    <button
                      type="button"
                      onClick={() => bringToFront(el.id)}
                      className="rounded border border-gray-300 px-1 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => sendToBack(el.id)}
                      className="rounded border border-gray-300 px-1 py-0.5 text-[10px] text-gray-600 hover:bg-gray-100"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeElement(el.id)}
                      className="rounded border border-red-200 px-1 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {el.type === "text" && isSelected && (
                  <textarea
                    value={el.data.textContent || ""}
                    onChange={(e) => handleTextChange(el, e.target.value)}
                    className="mt-2 w-full rounded border border-gray-300 p-1 text-[11px] focus:border-brand focus:ring-1 focus:ring-brand"
                    rows={2}
                    placeholder="Editar texto..."
                  />
                )}
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
                    <span>Rotar:</span>
                    <button
                      type="button"
                      onClick={() => handleRotate(el, -10)}
                      className="rounded border border-gray-300 px-1 py-0.5 hover:bg-gray-100"
                    >
                      ↺
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotate(el, 10)}
                      className="rounded border border-gray-300 px-1 py-0.5 hover:bg-gray-100"
                    >
                      ↻
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <p className="mt-2 text-[10px] text-gray-400">
        Selecciona una capa para editar, bloquear o cambiar su orden.
      </p>
    </aside>
  );
}
