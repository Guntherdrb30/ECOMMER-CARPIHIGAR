"use client";

import React, { useCallback, useState } from "react";
import MoodboardEditor from "@/app/moodboard/components/MoodboardEditor";
import MoodboardGallery from "@/app/moodboard/components/MoodboardGallery";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import type { Moodboard } from "@/app/moodboard/lib/moodboardTypes";

export default function MoodboardPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const setFromServer = useMoodboardStore((s) => s.setFromServer);

  const handleOpenMoodboard = useCallback(
    (m: Moodboard) => {
      setFromServer(m);
      setActiveId(m.id);
    },
    [setFromServer],
  );

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 md:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moodboard Carpihogar</h1>
            <p className="mt-1 text-sm text-gray-600">
              Crea composiciones visuales con productos reales de la tienda para tus
              proyectos de interiorismo.
            </p>
          </div>
        </header>

        <MoodboardEditor
          className="flex-1"
          activeMoodboardId={activeId}
          onSaved={(id) => {
            setActiveId(id);
            setReloadKey((k) => k + 1);
          }}
          gallerySlot={
            <MoodboardGallery
              activeMoodboardId={activeId}
              onOpen={handleOpenMoodboard}
              onActiveIdChange={setActiveId}
              reloadKey={reloadKey}
            />
          }
        />
      </div>
    </div>
  );
}
