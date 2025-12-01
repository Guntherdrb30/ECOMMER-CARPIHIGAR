"use client";

import React, { useRef, useState } from "react";
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
    width: 220,
    height: 260,
    rotation: 0,
    opacity: 1,
    locked: false,
    data: {
      productId: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
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

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

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
        const x = e.clientX - rect.left - 110;
        const y = e.clientY - rect.top - 130;
        const element = createElementFromProduct(payload.product, x, y);
        addElement(element);
      }
    } catch {
      // ignore
    }
  };

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement>,
    element: MoodboardElement,
  ) => {
    if (element.locked) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
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

  const renderElementContent = (el: MoodboardElement) => {
    if (el.type === "product") {
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white">
          <div className="h-24 w-full flex-shrink-0 bg-gray-200">
            {el.data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={el.data.imageUrl}
                alt={el.data.name || ""}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col justify-between p-2">
            <div>
              <p className="line-clamp-2 text-xs font-semibold text-gray-800">
                {el.data.name}
              </p>
              <p className="text-[11px] text-gray-500">
                {el.data.code || "Sin código"}
              </p>
            </div>
            {typeof el.data.price === "number" && (
              <p className="mt-1 text-xs font-bold text-brand">
                ${el.data.price.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (el.type === "image") {
      return (
        <div className="h-full w-full overflow-hidden rounded-lg bg-gray-200">
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
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-center">
        <p className="text-sm font-semibold text-gray-800">
          {el.data.textContent || "Texto"}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={boardRef}
      className={`relative h-[600px] w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 shadow-inner ${className ?? ""}`}
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
            {renderElementContent(el)}
            {!el.locked && (
              <div
                onMouseDown={(e) => handleResizeStart(e, el)}
                className="absolute bottom-1 right-1 h-3 w-3 cursor-se-resize rounded-sm bg-brand shadow-sm"
              />
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

