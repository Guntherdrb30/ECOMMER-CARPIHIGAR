"use client";

import React, { useRef, useState } from "react";
import {
  Trash2,
  RotateCw,
  RotateCcw,
  ArrowUpToLine,
  ArrowDownToLine,
  Lock,
  Unlock,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
} from "lucide-react";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

interface CanvasBoardProps {
  className?: string;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  id: string;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
}

const TEXT_COLORS = ["#111827", "#F97316", "#1D4ED8", "#047857", "#DC2626"];
const BG_COLORS = ["#FFFFFF", "#F9FAFB", "#FEF3C7", "#E0F2FE", "#FEE2E2", "#ECFDF5"];

const FONT_OPTIONS: {
  key: "system" | "serif" | "mono" | "script";
  label: string;
}[] = [
  { key: "system", label: "Sans" },
  { key: "serif", label: "Serif" },
  { key: "mono", label: "Mono" },
  { key: "script", label: "Script" },
];

function createElementFromProduct(
  product: any,
  x: number,
  y: number,
): MoodboardElement {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    type: "product",
    x,
    y,
    width: 240,
    height: 240,
    rotation: 0,
    opacity: 1,
    locked: false,
    data: {
      productId: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      backgroundColor: "#F3F4F6",
    },
  };
}

export default function CanvasBoard({ className }: CanvasBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const elements = useMoodboardStore((s) => s.elements);
  const selectedElementId = useMoodboardStore((s) => s.selectedElementId);
  const addElement = useMoodboardStore((s) => s.addElement);
  const updateElement = useMoodboardStore((s) => s.updateElement);
  const setSelectedElement = useMoodboardStore((s) => s.setSelectedElement);
  const bringToFront = useMoodboardStore((s) => s.bringToFront);
  const sendToBack = useMoodboardStore((s) => s.sendToBack);
  const lockElement = useMoodboardStore((s) => s.lockElement);
  const unlockElement = useMoodboardStore((s) => s.unlockElement);
  const removeElement = useMoodboardStore((s) => s.removeElement);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [actionsForId, setActionsForId] = useState<string | null>(null);

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;

    try {
      const payload = JSON.parse(data);
      if (payload.type === "product" && payload.product) {
        const x = e.clientX - rect.left - 120;
        const y = e.clientY - rect.top - 120;
        const element = createElementFromProduct(payload.product, x, y);
        addElement(element);
      }
    } catch {
      // ignore payload errors
    }
  };

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement>,
    element: MoodboardElement,
  ) => {
    if (element.locked) return;

    const rect = e.currentTarget.getBoundingClientRect();

    setDragState({
      id: element.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setSelectedElement(element.id);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();

    if (dragState) {
      e.preventDefault();
      const x = e.clientX - rect.left - dragState.offsetX;
      const y = e.clientY - rect.top - dragState.offsetY;
      updateElement(dragState.id, { x, y });
      return;
    }

    if (resizeState) {
      e.preventDefault();
      const deltaX = e.clientX - resizeState.startX;
      const deltaY = e.clientY - resizeState.startY;
      const width = Math.max(80, resizeState.startWidth + deltaX);
      const height = Math.max(80, resizeState.startHeight + deltaY);
      updateElement(resizeState.id, { width, height });
    }
  };

  const handleMouseUp = () => {
    if (dragState) setDragState(null);
    if (resizeState) setResizeState(null);
  };

  const handleCanvasClick = () => {
    setSelectedElement(null);
    setActionsForId(null);
  };

  const handleResizeStart = (
    e: React.MouseEvent<HTMLDivElement>,
    element: MoodboardElement,
  ) => {
    if (element.locked) return;
    e.stopPropagation();

    setResizeState({
      id: element.id,
      startWidth: element.width,
      startHeight: element.height,
      startX: e.clientX,
      startY: e.clientY,
    });
    setSelectedElement(element.id);
  };

  const renderElementContent = (el: MoodboardElement, isSelected: boolean) => {
    if (el.type === "product") {
      const backgroundColor = el.data.backgroundColor || "#F3F4F6";
      return (
        <div
          className="h-full w-full overflow-hidden rounded-lg"
          style={{ backgroundColor }}
        >
          {el.data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={el.data.imageUrl}
              alt={el.data.name || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-gray-500">
              {el.data.name || el.data.code || "Producto sin imagen"}
            </div>
          )}
        </div>
      );
    }

    if (el.type === "image") {
      const backgroundColor = el.data.backgroundColor || "#F3F4F6";
      return (
        <div
          className="h-full w-full overflow-hidden rounded-lg"
          style={{ backgroundColor }}
        >
          {el.data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={el.data.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      );
    }

    // text
    const value = el.data.textContent ?? "";
    const textColor = el.data.textColor || "#111827";
    const fontSize = el.data.fontSize ?? 14;
    const fontFamilyKey = el.data.fontFamily || "system";
    const fontWeight = el.data.fontWeight ?? "normal";
    const fontStyle = el.data.fontStyle ?? "normal";
    const textAlign = el.data.textAlign ?? "center";
    const backgroundColor = el.data.backgroundColor || "#FFFFFF";

    const fontFamily =
      fontFamilyKey === "serif"
        ? "Georgia, Cambria, 'Times New Roman', serif"
        : fontFamilyKey === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
        : fontFamilyKey === "script"
        ? "'Segoe Script', 'Brush Script MT', cursive"
        : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    if (isSelected) {
      return (
        <div
          className="flex h-full w-full items-center justify-center rounded-lg px-3 py-2 text-center"
          style={{ backgroundColor }}
        >
          <textarea
            value={value}
            onChange={(e) =>
              updateElement(el.id, {
                data: { ...el.data, textContent: e.target.value },
              })
            }
            style={{
              color: textColor,
              fontFamily,
              fontSize,
              fontWeight,
              fontStyle,
              textAlign,
            }}
            className="h-full w-full resize-none border-none bg-transparent font-semibold focus:outline-none"
            placeholder="Escribe aquí..."
          />
        </div>
      );
    }

    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-lg px-3 py-2 text-center"
        style={{ backgroundColor }}
      >
        <p
          className="font-semibold"
          style={{
            color: textColor,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            textAlign,
          }}
        >
          {value || "Texto"}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={boardRef}
      className={`relative z-0 h-[600px] w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 shadow-inner ${
        className ?? ""
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {elements.map((el) => {
        const isSelected = el.id === selectedElementId;

        return (
          <div
            key={el.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart(e, el);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setSelectedElement(el.id);
              setActionsForId(el.id);
            }}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              transform: `rotate(${el.rotation}deg)`,
              cursor: el.locked ? "default" : "move",
            }}
            className={`group rounded-xl border bg-white shadow-md transition-shadow ${
              isSelected
                ? "border-brand ring-2 ring-brand/60"
                : "border-gray-200 hover:shadow-lg"
            } ${el.locked ? "opacity-80" : ""}`}
          >
            {renderElementContent(el, isSelected)}

            {!el.locked && (
              <div
                onMouseDown={(e) => handleResizeStart(e, el)}
                className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-sm bg-brand shadow-sm"
              />
            )}

            {actionsForId === el.id && (
              <div className="absolute -top-2 left-1/2 z-20 flex -translate-x-1/2 translate-y-[-100%] flex-wrap items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] shadow-md">
                {/* Rotación */}
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-brand"
                  title="Rotar -15°"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    updateElement(el.id, { rotation: el.rotation - 15 });
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-brand"
                  title="Rotar +15°"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    updateElement(el.id, { rotation: el.rotation + 15 });
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>

                {/* Z-index */}
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-brand"
                  title="Traer al frente"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    bringToFront(el.id);
                  }}
                >
                  <ArrowUpToLine className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-brand"
                  title="Enviar al fondo"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    sendToBack(el.id);
                  }}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                </button>

                {/* Estilos de texto (solo para elementos de texto) */}
                {el.type === "text" && (
                  <>
                    {/* Colores de texto */}
                    <span className="mx-1 h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-1">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="h-3.5 w-3.5 rounded-full border border-white shadow"
                          style={{ backgroundColor: c }}
                          title="Color de texto"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            updateElement(el.id, {
                              data: { ...el.data, textColor: c },
                            });
                          }}
                        />
                      ))}
                    </div>

                    {/* Familia tipográfica */}
                    <div className="ml-1 flex items-center gap-1">
                      {FONT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          className={`rounded border px-1.5 py-0.5 text-[10px] ${
                            el.data.fontFamily === opt.key
                              ? "border-brand bg-brand/5 text-brand"
                              : "border-gray-200 text-gray-500 hover:border-brand/50"
                          }`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            updateElement(el.id, {
                              data: { ...el.data, fontFamily: opt.key },
                            });
                          }}
                          title={opt.label}
                        >
                          Aa
                        </button>
                      ))}
                    </div>

                    {/* Tamaño de fuente */}
                    <span className="mx-1 h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        className="rounded border border-gray-200 px-1 text-[10px] text-gray-600 hover:border-brand/60 hover:text-brand"
                        title="Reducir tamaño de texto"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const current = el.data.fontSize ?? 14;
                          const next = Math.max(10, current - 2);
                          updateElement(el.id, {
                            data: { ...el.data, fontSize: next },
                          });
                        }}
                      >
                        A-
                      </button>
                      <span className="min-w-[20px] text-center text-[10px] text-gray-500">
                        {el.data.fontSize ?? 14}
                      </span>
                      <button
                        type="button"
                        className="rounded border border-gray-200 px-1 text-[10px] text-gray-600 hover:border-brand/60 hover:text-brand"
                        title="Aumentar tamaño de texto"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const current = el.data.fontSize ?? 14;
                          const next = Math.min(42, current + 2);
                          updateElement(el.id, {
                            data: { ...el.data, fontSize: next },
                          });
                        }}
                      >
                        A+
                      </button>
                    </div>

                    {/* Negrita / cursiva */}
                    <div className="ml-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        className={`rounded border px-1.5 py-0.5 text-[10px] ${
                          el.data.fontWeight === "bold"
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-brand/50"
                        }`}
                        title="Negrita"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const next =
                            el.data.fontWeight === "bold" ? "normal" : "bold";
                          updateElement(el.id, {
                            data: { ...el.data, fontWeight: next },
                          });
                        }}
                      >
                        <Bold className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={`rounded border px-1.5 py-0.5 text-[10px] ${
                          el.data.fontStyle === "italic"
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-brand/50"
                        }`}
                        title="Cursiva"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const next =
                            el.data.fontStyle === "italic"
                              ? "normal"
                              : "italic";
                          updateElement(el.id, {
                            data: { ...el.data, fontStyle: next },
                          });
                        }}
                      >
                        <Italic className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Alineación */}
                    <div className="ml-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        className={`rounded border px-1 py-0.5 text-[10px] ${
                          (el.data.textAlign ?? "center") === "left"
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-brand/50"
                        }`}
                        title="Alinear a la izquierda"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          updateElement(el.id, {
                            data: { ...el.data, textAlign: "left" },
                          });
                        }}
                      >
                        <AlignLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={`rounded border px-1 py-0.5 text-[10px] ${
                          (el.data.textAlign ?? "center") === "center"
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-brand/50"
                        }`}
                        title="Centrar texto"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          updateElement(el.id, {
                            data: { ...el.data, textAlign: "center" },
                          });
                        }}
                      >
                        <AlignCenter className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className={`rounded border px-1 py-0.5 text-[10px] ${
                          (el.data.textAlign ?? "center") === "right"
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-gray-200 text-gray-500 hover:border-brand/50"
                        }`}
                        title="Alinear a la derecha"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          updateElement(el.id, {
                            data: { ...el.data, textAlign: "right" },
                          });
                        }}
                      >
                        <AlignRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Fondo del recuadro de texto */}
                    <span className="mx-1 h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-1">
                      {BG_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`h-3.5 w-3.5 rounded border ${
                            (el.data.backgroundColor || "#FFFFFF") === c
                              ? "border-brand"
                              : "border-gray-200"
                          }`}
                          style={{ backgroundColor: c }}
                          title="Color de fondo"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            updateElement(el.id, {
                              data: { ...el.data, backgroundColor: c },
                            });
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Controles para imágenes simples (cambiar imagen / fondo) */}
                {el.type === "image" && (
                  <>
                    <span className="mx-1 h-4 w-px bg-gray-200" />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 hover:border-brand/60 hover:text-brand"
                      title="Cambiar imagen (URL)"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const url = window.prompt(
                          "Pega la URL de la nueva imagen:",
                          el.data.imageUrl || "",
                        );
                        if (!url) return;
                        updateElement(el.id, {
                          data: { ...el.data, imageUrl: url },
                        });
                      }}
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Cambiar</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {BG_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`h-3.5 w-3.5 rounded border ${
                            (el.data.backgroundColor || "#F3F4F6") === c
                              ? "border-brand"
                              : "border-gray-200"
                          }`}
                          style={{ backgroundColor: c }}
                          title="Color de fondo"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            updateElement(el.id, {
                              data: { ...el.data, backgroundColor: c },
                            });
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Lock / unlock */}
                <button
                  type="button"
                  className="p-1 text-gray-600 hover:text-brand"
                  title={el.locked ? "Desbloquear" : "Bloquear"}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (el.locked) {
                      unlockElement(el.id);
                    } else {
                      lockElement(el.id);
                    }
                    setActionsForId(null);
                  }}
                >
                  {el.locked ? (
                    <Unlock className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Eliminar"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    removeElement(el.id);
                    setActionsForId(null);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-x-4 bottom-3 flex justify-between text-[10px] text-gray-400">
        <span>Arrastra productos aquí</span>
        <span>@Carpihogar</span>
      </div>
    </div>
  );
}

