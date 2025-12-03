"use client";

import React, { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Layers,
  LayoutPanelLeft,
  Boxes,
  LayoutTemplate,
  Type,
  Image as ImageIcon,
  Link2,
  StickyNote,
} from "lucide-react";
import Toolbar from "@/app/moodboard/components/Toolbar";
import ProductSidebar from "@/app/moodboard/components/ProductSidebar";
import CanvasBoard from "@/app/moodboard/components/CanvasBoard";
import LayerList from "@/app/moodboard/components/LayerList";
import BudgetSummary from "@/app/moodboard/components/BudgetSummary";
import TemplateSidebar from "@/app/moodboard/components/TemplateSidebar";
import TextCardSidebar from "@/app/moodboard/components/TextCardSidebar";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import {
  saveMoodboard,
  uploadMoodboardThumbnail,
  publishMoodboardNews,
} from "@/app/moodboard/lib/moodboardApi";
import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

interface MoodboardEditorProps {
  activeMoodboardId: string | null;
  onSaved: (id: string) => void;
  gallerySlot?: React.ReactNode;
  className?: string;
}

const BOARD_BG_COLORS = ["#f9fafb", "#ffffff", "#fef3c7", "#e0f2fe", "#f5f5f4"];

export default function MoodboardEditor({
  activeMoodboardId,
  onSaved,
  gallerySlot,
  className,
}: MoodboardEditorProps) {
  const { data: session } = useSession();
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  const elements = useMoodboardStore((s) => s.elements);
  const title = useMoodboardStore((s) => s.title);
  const addElement = useMoodboardStore((s) => s.addElement);
  const backgroundColor = useMoodboardStore((s) => s.backgroundColor);
  const setBackgroundColor = useMoodboardStore((s) => s.setBackgroundColor);

  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<
    "products" | "templates" | "cards" | "gallery" | "layers" | null
  >(null);

  const isAlly = (session?.user as any)?.role === "ALIADO";

  const createElementId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const handleAddText = () => {
    const id = createElementId();
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
        textColor: "#111827",
        fontFamily: "system",
        fontSize: 14,
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
      },
    };
    addElement(element);
  };

  const handleAddImageFromUrl = () => {
    const url = window.prompt("Pega la URL de la imagen:");
    if (!url) return;

    const id = createElementId();
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

      const id = createElementId();
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

  const maybePublishNews = useCallback(
    async (dataUrl: string | null) => {
      if (!isAlly || !dataUrl) return;
      if (typeof window === "undefined") return;

      const ok = window.confirm(
        "¿Quieres publicar este moodboard en Novedades? (aparecerá en la sección Novedades de Carpihogar)",
      );
      if (!ok) return;

      try {
        await publishMoodboardNews({
          imageDataUrl: dataUrl,
          title: title.trim() || undefined,
        });
        // eslint-disable-next-line no-alert
        alert("Tu moodboard fue enviado a Novedades.");
      } catch (e: any) {
        // eslint-disable-next-line no-alert
        alert(e?.message || "No se pudo publicar en Novedades.");
      }
    },
    [isAlly, title],
  );

  const captureCanvasDataUrl = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    if (!elements.length) return null;

    try {
      const margin = 40;
      let maxX = 0;
      let maxY = 0;

      elements.forEach((el) => {
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      });

      const width = Math.max(800, Math.ceil(maxX + margin));
      const height = Math.max(600, Math.ceil(maxY + margin));

      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.scale(2, 2);

      const boardBg = backgroundColor || "#f9fafb";
      ctx.fillStyle = boardBg;
      ctx.fillRect(0, 0, width, height);

      const urls = new Set<string>();
      elements.forEach((el) => {
        const url = el.data.imageUrl;
        if (url) urls.add(url);
      });

      const imageMap = new Map<string, HTMLImageElement>();
      await Promise.all(
        Array.from(urls).map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                imageMap.set(url, img);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = url;
            }),
        ),
      );

      const toRad = (deg: number) => (deg * Math.PI) / 180;

      elements.forEach((el) => {
        const opacity = el.opacity ?? 1;
        const rotation = el.rotation ?? 0;
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(cx, cy);
        ctx.rotate(toRad(rotation));
        ctx.translate(-el.width / 2, -el.height / 2);

        if (el.type === "product" || el.type === "image") {
          const bg = el.data.backgroundColor || "#F3F4F6";
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, el.width, el.height);

          const url = el.data.imageUrl;
          const img = url ? imageMap.get(url) : undefined;
          if (img) {
            ctx.drawImage(img, 0, 0, el.width, el.height);
          }
        } else if (el.type === "text") {
          const bg = el.data.backgroundColor || "#FFFFFF";
          const textColor = el.data.textColor || "#111827";
          const fontSize = el.data.fontSize ?? 14;
          const fontFamilyKey = el.data.fontFamily || "system";
          const fontWeight = el.data.fontWeight || "normal";
          const fontStyle = el.data.fontStyle || "normal";
          const textAlign = el.data.textAlign || "center";
          const value = el.data.textContent ?? "";

          const fontFamily =
            fontFamilyKey === "serif"
              ? "Georgia, Cambria, 'Times New Roman', serif"
              : fontFamilyKey === "mono"
              ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              : fontFamilyKey === "script"
              ? "'Segoe Script', 'Brush Script MT', cursive"
              : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, el.width, el.height);

          ctx.fillStyle = textColor;
          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.textAlign = textAlign as CanvasTextAlign;
          ctx.textBaseline = "middle";

          const lines = value.split(/\r?\n/);
          const lineHeight = fontSize * 1.3;
          const totalHeight = lineHeight * lines.length;

          lines.forEach((line, index) => {
            const y =
              el.height / 2 - totalHeight / 2 + lineHeight * (index + 0.5);
            let x = el.width / 2;
            if (textAlign === "left") x = 8;
            if (textAlign === "right") x = el.width - 8;
            ctx.fillText(line, x, y);
          });
        }

        ctx.restore();
      });

      // Marca de agua
      ctx.save();
      const watermark = "Carpihogar.com";
      const padding = 16;
      ctx.font =
        "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      const metrics = ctx.measureText(watermark);
      const textWidth = metrics.width;
      const x = width - textWidth - padding;
      const y = height - padding;
      ctx.fillText(watermark, x, y);
      ctx.restore();

      return canvas.toDataURL("image/png");
    } catch (e) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.error("Error capturando moodboard:", e);
      }
      return null;
    }
  }, [backgroundColor, elements]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const payload = {
        id: activeMoodboardId ?? undefined,
        title: title.trim() || "Moodboard sin título",
        elements,
        backgroundColor,
      };

      const saved = await saveMoodboard(payload);
      onSaved(saved.id);

      const dataUrl = await captureCanvasDataUrl();
      await maybePublishNews(dataUrl);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "No se pudo guardar el moodboard.");
    } finally {
      setSaving(false);
    }
  }, [
    activeMoodboardId,
    backgroundColor,
    captureCanvasDataUrl,
    elements,
    maybePublishNews,
    onSaved,
    title,
  ]);

  const handleExport = useCallback(async () => {
    if (!canvasWrapperRef.current) return;
    try {
      const dataUrl = await captureCanvasDataUrl();
      if (!dataUrl) {
        throw new Error(
          "No se pudo generar la imagen del moodboard en este navegador (algunos estilos de color no son compatibles). Tu moodboard igual queda guardado; mientras tanto puedes usar una captura de pantalla.",
        );
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${title || "moodboard"}-carpihogar.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (activeMoodboardId) {
        await uploadMoodboardThumbnail(activeMoodboardId, dataUrl);
      }

      await maybePublishNews(dataUrl);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "No se pudo exportar el moodboard.");
    }
  }, [activeMoodboardId, captureCanvasDataUrl, maybePublishNews, title]);

  const handleToggleTool = (
    tool: "products" | "templates" | "cards" | "gallery" | "layers",
  ) => {
    setActiveTool((current) => (current === tool ? null : tool));
  };

  return (
    <section
      className={`flex h-full flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-md ${
        className ?? ""
      }`}
    >
      <Toolbar
        onSave={() => void handleSave()}
        onExport={() => void handleExport()}
        saving={saving}
      />

      <div className="flex flex-1 gap-4">
        {/* Barra lateral fija (área azul) */}
        <div className="flex w-[64px] flex-col">
          <div className="flex h-full flex-col items-center justify-between gap-4 rounded-xl bg-gray-900 px-1 py-3 text-white shadow-md">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleTool("products")}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  activeTool === "products"
                    ? "bg-white text-gray-900"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                title="Productos"
              >
                <Boxes className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleTool("templates")}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  activeTool === "templates"
                    ? "bg-white text-gray-900"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                title="Plantillas"
              >
                <LayoutTemplate className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleTool("cards")}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  activeTool === "cards"
                    ? "bg-white text-gray-900"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                title="Tarjetas de texto"
              >
                <StickyNote className="h-4 w-4" />
              </button>
              {gallerySlot && (
                <button
                  type="button"
                  onClick={() => handleToggleTool("gallery")}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    activeTool === "gallery"
                      ? "bg-white text-gray-900"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                  title="Mis moodboards"
                >
                  <LayoutPanelLeft className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Acciones rápidas y utilidades */}
            <div className="flex flex-col items-center gap-2">
              {/* Texto e imágenes */}
              <button
                type="button"
                onClick={handleAddText}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold hover:bg-gray-700"
                title="Añadir texto"
              >
                <Type className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleAddImageFromUrl}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold hover:bg-gray-700"
                title="Añadir imagen por URL"
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>
              <label
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gray-800 text-xs font-semibold hover:bg-gray-700"
                title="Subir imagen"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleAddImageFromFile(file);
                      e.target.value = "";
                    }
                  }}
                />
              </label>

              {/* Capas (panel flotante) */}
              <button
                type="button"
                onClick={() => handleToggleTool("layers")}
                className={`mt-4 flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  activeTool === "layers"
                    ? "bg-white text-gray-900"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
                title={
                  activeTool === "layers"
                    ? "Ocultar capas"
                    : "Mostrar capas"
                }
                aria-label={
                  activeTool === "layers"
                    ? "Ocultar panel de capas"
                    : "Mostrar panel de capas"
                }
              >
                <Layers className="h-4 w-4" />
              </button>

              {/* Color de fondo del lienzo */}
              <div className="mt-3 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-300">Fondo</span>
                <div className="flex flex-wrap justify-center gap-1">
                  {BOARD_BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-4 w-4 rounded-full border ${
                        backgroundColor === color
                          ? "border-white ring-2 ring-brand"
                          : "border-gray-600"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                      aria-label={`Cambiar fondo a ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zona principal: lienzo + paneles flotantes */}
        <div className="relative flex-1">
          {activeTool && (
            <div className="pointer-events-none absolute inset-0 z-20 flex justify-start">
              <div className="pointer-events-auto mt-1 h-full w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                {activeTool === "products" && (
                  <ProductSidebar className="h-full" />
                )}
                {activeTool === "templates" && (
                  <TemplateSidebar className="h-full" />
                )}
                {activeTool === "cards" && (
                  <TextCardSidebar className="h-full" />
                )}
                {activeTool === "gallery" && gallerySlot && (
                  <div className="h-full">{gallerySlot}</div>
                )}
                {activeTool === "layers" && (
                  <LayerList className="h-full" />
                )}
              </div>
            </div>
          )}

          <div
            id="moodboard-capture-root"
            ref={canvasWrapperRef}
            className="flex min-h-[620px] items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 p-4"
          >
            <CanvasBoard />
          </div>
          <div className="mt-3">
            <BudgetSummary />
          </div>
        </div>
      </div>
    </section>
  );
}
