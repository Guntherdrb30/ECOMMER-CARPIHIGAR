"use client";

import React, { useCallback, useState } from "react";
import { Card, CardBody, Chip } from "@heroui/react";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 px-4 py-8 md:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="border-0 bg-gradient-to-r from-white/80 via-white to-orange-50/60 shadow-md">
          <CardBody className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="space-y-2">
              <Chip
                variant="flat"
                color="danger"
                size="sm"
                className="bg-red-50 text-red-600"
              >
                Experiencia visual Carpihogar
              </Chip>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                  Moodboard Carpihogar
                </h1>
                <p className="mt-1 max-w-xl text-sm text-gray-600 md:text-[15px]">
                  Diseña composiciones impactantes con productos reales de la tienda,
                  comparte ideas con tus clientes y guarda tus propuestas en un solo lugar.
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                <Chip size="sm" variant="bordered" className="border-gray-200">
                  Arquitectos y diseñadores
                </Chip>
                <Chip size="sm" variant="bordered" className="border-gray-200">
                  Clientes finales
                </Chip>
                <Chip size="sm" variant="bordered" className="border-gray-200">
                  Presentaciones profesionales
                </Chip>
              </div>
            </div>
            <div className="mt-2 flex w-full justify-start gap-4 md:mt-0 md:w-auto md:justify-end">
              <div className="hidden flex-col text-right text-[11px] text-gray-500 md:flex">
                <span>Arrastra productos desde la izquierda</span>
                <span>Crea tu lienzo y guárdalo como proyecto</span>
              </div>
            </div>
          </CardBody>
        </Card>

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
