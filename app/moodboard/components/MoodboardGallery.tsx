"use client";

import React, { useEffect, useState } from "react";
import type { Moodboard } from "@/app/moodboard/lib/moodboardTypes";
import { deleteMoodboard, listMoodboards, saveMoodboard } from "@/app/moodboard/lib/moodboardApi";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";

interface MoodboardGalleryProps {
  activeMoodboardId: string | null;
  onOpen: (m: Moodboard) => void;
  onActiveIdChange?: (id: string | null) => void;
  reloadKey?: number;
}

export default function MoodboardGallery({
  activeMoodboardId,
  onOpen,
  onActiveIdChange,
  reloadKey,
}: MoodboardGalleryProps) {
  const [items, setItems] = useState<Moodboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetStore = useMoodboardStore((s) => s.reset);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listMoodboards();
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar tus moodboards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [reloadKey]);

  const handleOpen = (m: Moodboard) => {
    onOpen(m);
    onActiveIdChange?.(m.id);
  };

  const handleNew = () => {
    resetStore();
    onActiveIdChange?.(null);
  };

  const handleDuplicate = async (m: Moodboard) => {
    try {
      const copy = await saveMoodboard({
        title: `${m.title} (copia)`,
        elements: m.elements,
        backgroundColor: m.backgroundColor,
        thumbnailDataUrl: m.thumbnailUrl ?? undefined,
      });
      setItems((prev) => [copy, ...prev]);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "No se pudo duplicar el moodboard.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este moodboard de forma permanente?")) return;
    try {
      await deleteMoodboard(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      if (activeMoodboardId === id) {
        onActiveIdChange?.(null);
        resetStore();
      }
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "No se pudo eliminar el moodboard.");
    }
  };

  return (
    <section className="flex h-full flex-col rounded-xl bg-white p-4 shadow-md border border-gray-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">Mis moodboards</h2>
        <button
          type="button"
          onClick={handleNew}
          className="rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-brand/90"
        >
          Nuevo moodboard
        </button>
      </div>
      {loading && <p className="text-xs text-gray-500">Cargando moodboards...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="mt-2 grid flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-1">
        {items.map((m) => {
          const isActive = m.id === activeMoodboardId;
          const date = new Date(m.updatedAt);
          return (
            <div
              key={m.id}
              className={`flex flex-col rounded-lg border p-2 text-xs shadow-sm ${
                isActive ? "border-brand bg-brand/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="mb-2 h-24 w-full overflow-hidden rounded-md bg-gray-200">
                {m.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.thumbnailUrl}
                    alt={m.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-gray-500">
                    Vista previa no disponible
                  </div>
                )}
              </div>
              <p className="truncate font-semibold text-gray-800">{m.title}</p>
              <p className="text-[11px] text-gray-500">
                Actualizado {date.toLocaleDateString()} {date.toLocaleTimeString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpen(m)}
                  className="flex-1 rounded-md bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-gray-800"
                >
                  Abrir / Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDuplicate(m)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
                >
                  Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(m.id)}
                  className="rounded-md border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {items.length === 0 && !loading && !error && (
        <p className="mt-2 text-xs text-gray-500">
          Aún no has guardado moodboards. Crea uno nuevo y guárdalo desde el editor.
        </p>
      )}
    </section>
  );
}
