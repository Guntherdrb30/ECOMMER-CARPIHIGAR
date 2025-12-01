"use client";

import React from "react";
import { MOODBOARD_TEMPLATES } from "@/app/moodboard/lib/moodboardTemplates";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";

interface TemplateSidebarProps {
  className?: string;
}

export default function TemplateSidebar({ className }: TemplateSidebarProps) {
  const applyTemplate = useMoodboardStore((s) => s.applyTemplate);

  return (
    <aside
      className={`flex h-full flex-col rounded-xl bg-white p-3 shadow-md border border-gray-200 ${className ?? ""}`}
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-800">Plantillas</h2>
      <p className="mb-3 text-[11px] text-gray-500">
        Elige una plantilla para precargar el lienzo. Luego puedes ajustarla con productos
        reales de la tienda.
      </p>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {MOODBOARD_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => applyTemplate(tpl.title, tpl.elements)}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-left text-xs hover:border-brand hover:bg-white"
          >
            <div
              className="h-12 w-16 flex-shrink-0 rounded-md border border-gray-200"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9)), " +
                  `linear-gradient(45deg, ${tpl.previewColor}, #ffffff)`,
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gray-800">
                {tpl.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                {tpl.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

