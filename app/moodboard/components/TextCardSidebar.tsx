"use client";

import React from "react";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

interface TextCardSidebarProps {
  className?: string;
}

type TextCardDefinition = {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  data: MoodboardElement["data"];
};

const TEXT_CARDS: TextCardDefinition[] = [
  {
    id: "project-title",
    title: "Título de proyecto",
    description: "Bloque grande para el nombre del moodboard.",
    width: 320,
    height: 90,
    data: {
      textContent: "Proyecto Carpihogar",
      textColor: "#111827",
      fontFamily: "serif",
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "left",
      backgroundColor: "#FEF3C7",
    },
  },
  {
    id: "designer-note",
    title: "Nota del diseñador",
    description: "Texto tipo nota para explicar la idea general.",
    width: 260,
    height: 120,
    data: {
      textContent:
        "Notas del espacio:\n• Concepto general\n• Paleta de color\n• Materiales clave",
      textColor: "#374151",
      fontFamily: "system",
      fontSize: 13,
      textAlign: "left",
      backgroundColor: "#FFF7ED",
    },
  },
  {
    id: "checklist",
    title: "Checklist",
    description: "Lista de puntos para revisar con el cliente.",
    width: 240,
    height: 140,
    data: {
      textContent:
        "Checklist del proyecto:\n- Iluminación\n- Almacenamiento\n- Acabados\n- Presupuesto",
      textColor: "#111827",
      fontFamily: "mono",
      fontSize: 12,
      textAlign: "left",
      backgroundColor: "#E5E7EB",
    },
  },
  {
    id: "quote",
    title: "Frase inspiradora",
    description: "Tarjeta para colocar una frase o concepto clave.",
    width: 260,
    height: 110,
    data: {
      textContent:
        "“Los espacios cuentan historias.\nEste moodboard es el inicio de la tuya.”",
      textColor: "#1F2937",
      fontFamily: "script",
      fontSize: 16,
      textAlign: "center",
      backgroundColor: "#E0F2FE",
    },
  },
];

function createElementFromCard(card: TextCardDefinition): MoodboardElement {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    type: "text",
    x: 80,
    y: 80,
    width: card.width,
    height: card.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    data: { ...card.data },
  };
}

export default function TextCardSidebar({ className }: TextCardSidebarProps) {
  const addElement = useMoodboardStore((s) => s.addElement);

  return (
    <aside
      className={`flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-md ${
        className ?? ""
      }`}
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-800">
        Tarjetas de texto
      </h2>
      <p className="mb-3 text-[11px] text-gray-500">
        Inserta tarjetas con estilos predefinidos para títulos, notas y
        checklists. Luego podrás editarlas directamente en el lienzo.
      </p>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {TEXT_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              const el = createElementFromCard(card);
              addElement(el);
            }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-left text-xs transition-colors hover:border-brand hover:bg-white"
          >
            <p className="text-[13px] font-semibold text-gray-800">
              {card.title}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {card.description}
            </p>
            <div className="mt-2 rounded-md border border-dashed border-gray-200 bg-white px-2 py-1.5">
              <p
                className="line-clamp-3 text-[11px] text-gray-700"
                style={{
                  fontFamily:
                    card.data.fontFamily === "serif"
                      ? "Georgia, Cambria, 'Times New Roman', serif"
                      : card.data.fontFamily === "mono"
                      ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                      : card.data.fontFamily === "script"
                      ? "'Segoe Script', 'Brush Script MT', cursive"
                      : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
              >
                {card.data.textContent}
              </p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

