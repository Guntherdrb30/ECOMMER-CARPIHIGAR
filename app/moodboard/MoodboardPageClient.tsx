"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardBody, Chip } from "@heroui/react";
import MoodboardEditor from "@/app/moodboard/components/MoodboardEditor";
import MoodboardGallery from "@/app/moodboard/components/MoodboardGallery";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import type { Moodboard } from "@/app/moodboard/lib/moodboardTypes";

interface MoodboardPageClientProps {
  heroImages?: string[];
}

export default function MoodboardPageClient({
  heroImages,
}: MoodboardPageClientProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const setFromServer = useMoodboardStore((s) => s.setFromServer);

  const [heroIndex, setHeroIndex] = useState(0);
  const slides = (heroImages || []).filter(Boolean).slice(0, 3);
  const hasSlides = slides.length > 0;

  useEffect(() => {
    if (!hasSlides) return;
    setHeroIndex(0);
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [hasSlides, slides.length]);

  const handleOpenMoodboard = useCallback(
    (m: Moodboard) => {
      setFromServer(m);
      setActiveId(m.id);
    },
    [setFromServer],
  );

  const currentHeroImage = hasSlides ? slides[heroIndex] : null;

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
                  Diseña composiciones impactantes con productos reales de la
                  tienda, comparte ideas con tus clientes y guarda tus
                  propuestas en un solo lugar.
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
            <div className="mt-4 flex w-full items-center justify-center md:mt-0 md:w-80">
              <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner">
                {currentHeroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentHeroImage}
                    alt="Moodboard hero"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center text-[11px] text-gray-500">
                    Configura hasta 3 imágenes para el hero de Moodboard desde
                    Ajustes &gt; Moodboard (hero).
                  </div>
                )}
                {hasSlides && (
                  <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center">
                    <div className="rounded-full bg-black/40 px-2 py-1 text-[10px] text-white">
                      {slides.map((_, i) => (
                        <span
                          // eslint-disable-next-line react/no-array-index-key
                          key={i}
                          className={`mx-0.5 inline-block h-1.5 w-4 rounded-full ${
                            i === heroIndex ? "bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
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

