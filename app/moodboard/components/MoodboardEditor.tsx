"use client";

import React, { useCallback, useRef, useState } from "react";
import { Layers, LayoutPanelLeft } from "lucide-react";
import Toolbar from "@/app/moodboard/components/Toolbar";
import ProductSidebar from "@/app/moodboard/components/ProductSidebar";
import CanvasBoard from "@/app/moodboard/components/CanvasBoard";
import LayerList from "@/app/moodboard/components/LayerList";
import BudgetSummary from "@/app/moodboard/components/BudgetSummary";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import {
  saveMoodboard,
  uploadMoodboardThumbnail,
} from "@/app/moodboard/lib/moodboardApi";
import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

interface MoodboardEditorProps {
  activeMoodboardId: string | null;
  onSaved: (id: string) => void;
  showGallery?: boolean;
  onToggleGallery?: () => void;
  className?: string;
}

export default function MoodboardEditor({
  activeMoodboardId,
  onSaved,
  showGallery,
  onToggleGallery,
  className,
}: MoodboardEditorProps) {
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const elements = useMoodboardStore((s) => s.elements);
  const title = useMoodboardStore((s) => s.title);
  const addElement = useMoodboardStore((s) => s.addElement);

  const [saving, setSaving] = useState(false);
  const [showLayers, setShowLayers] = useState(true);

  const handleAddText = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const element: MoodboardElement = {
      id,
      type: "text",
      x: 80,
      y: 80,
      width: 240,
      height: 80,
      rotation: 0,
      opacity: 1,
      locked: false,
      data: {
        textContent: "Nuevo texto",
      },
    };
    addElement(element);
  };

  const handleAddImageFromUrl = () => {
    const url = prompt("Pega la URL de la imagen:");
    if (!url) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const element: MoodboardElement = {
      id,
      type: "image",
      x: 100,
      y: 100,
      width: 260,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      data: {
        imageUrl: url,
      },
    };
    addElement(element);
  };

  const handleAddImageFromFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("No se pudo subir la imagen.");
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        throw new Error("Respuesta inválida al subir la imagen.");
      }
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const element: MoodboardElement = {
        id,
        type: "image",
        x: 100,
        y: 100,
        width: 260,
        height: 200,
        rotation: 0,
        opacity: 1,
        locked: false,
        data: {
          imageUrl: data.url,
        },
      };
      addElement(element);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Error subiendo imagen.");
    }
  };

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const payload = {
        id: activeMoodboardId ?? undefined,
        title: title.trim() || "Moodboard sin título",
        elements,
      };
      const saved = await saveMoodboard(payload);
      onSaved(saved.id);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "No se pudo guardar el moodboard.");
    } finally {
      setSaving(false);
    }
  }, [activeMoodboardId, elements, onSaved, title]);

  const handleExport = useCallback(async () => {
    if (!canvasWrapperRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const node = canvasWrapperRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor: "#f9fafb",
        useCORS: true,
        scale: 2,
        logging: false,
      });

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const text = "Carpihogar.com";
        const padding = 16;
        ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const x = canvas.width - textWidth - padding;
        const y = canvas.height - padding;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillText(text, x, y);
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${title || "moodboard"}-carpihogar.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (activeMoodboardId) {
        await uploadMoodboardThumbnail(activeMoodboardId, dataUrl);
      }

      // Punto de integración futuro:
      // aquí se puede conectar una API de IA para generar thumbnails avanzados.
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "No se pudo exportar el moodboard.");
    }
  }, [activeMoodboardId, title]);

  return (
    <section
      className={`flex h-full flex-col gap-4 rounded-2xl bg-gray-50 p-4 shadow-md border border-gray-200 ${
        className ?? ""
      }`}
    >
      <Toolbar
        onSave={() => void handleSave()}
        onExport={() => void handleExport()}
        onAddText={handleAddText}
        onAddImageFromUrl={handleAddImageFromUrl}
        onAddImageFromFile={handleAddImageFromFile}
        saving={saving}
      />

      <div className="flex justify-end gap-2 text-[11px] text-gray-600">
        <button
          type="button"
          onClick={() => setShowLayers((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white/70 px-3 py-1 hover:bg-gray-100"
          aria-label={showLayers ? "Ocultar panel de capas" : "Mostrar panel de capas"}
        >
          <Layers className="h-3.5 w-3.5 text-gray-700" />
          <span className="hidden md:inline">
            {showLayers ? "Capas: visible" : "Capas: ocultas"}
          </span>
        </button>
        {typeof showGallery === "boolean" && onToggleGallery && (
          <button
            type="button"
            onClick={onToggleGallery}
            className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white/70 px-3 py-1 hover:bg-gray-100"
            aria-label={
              showGallery
                ? "Ocultar panel Mis moodboards"
                : "Mostrar panel Mis moodboards"
            }
          >
            <LayoutPanelLeft className="h-3.5 w-3.5 text-gray-700" />
            <span className="hidden md:inline">
              {showGallery ? "Mis moodboards: visible" : "Mis moodboards: oculto"}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-60 xl:w-64">
          <ProductSidebar />
        </div>
        <div className="flex-1">
          <div
            ref={canvasWrapperRef}
            className="flex min-h-[620px] items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-4"
          >
            <CanvasBoard />
          </div>
          <div className="mt-3">
            <BudgetSummary />
          </div>
        </div>
        {showLayers && (
          <div className="w-full lg:w-56 xl:w-64">
            <LayerList />
          </div>
        )}
      </div>
    </section>
  );
}
