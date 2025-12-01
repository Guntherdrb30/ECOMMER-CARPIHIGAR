"use client";

import React, { useMemo } from "react";
import { useMoodboardStore } from "@/app/moodboard/hooks/useMoodboardStore";
import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

function isProductElement(el: MoodboardElement): boolean {
  return el.type === "product" && !!el.data.productId;
}

export default function BudgetSummary() {
  const elements = useMoodboardStore((s) => s.elements);
  const updateElement = useMoodboardStore((s) => s.updateElement);

  const rows = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        productId: string;
        code: string;
        name: string;
        price: number;
        quantity: number;
        elementIds: string[];
      }
    >();

    elements.filter(isProductElement).forEach((el) => {
      const productId = String(el.data.productId);
      const code = el.data.code || "";
      const name = el.data.name || "Producto";
      const price = typeof el.data.price === "number" ? el.data.price : 0;
      const quantity = el.data.quantity ?? 1;
      const key = `${productId}::${code}::${price}`;
      const existing = groups.get(key);
      if (existing) {
        existing.quantity += quantity;
        existing.elementIds.push(el.id);
      } else {
        groups.set(key, {
          key,
          productId,
          code,
          name,
          price,
          quantity,
          elementIds: [el.id],
        });
      }
    });

    return Array.from(groups.values());
  }, [elements]);

  const total = useMemo(() => {
    return rows.reduce((sum, row) => sum + row.quantity * row.price, 0);
  }, [rows]);

  if (!rows.length) {
    return (
      <section className="rounded-xl bg-white p-3 text-xs text-gray-500 shadow-sm border border-gray-200">
        <p>No hay productos en el moodboard todavía.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-3 text-xs shadow-sm border border-gray-200">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">
          Resumen de productos
        </h2>
        <p className="text-[11px] text-gray-500">
          Cantidad y total aproximado
        </p>
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => {
          const qty = row.quantity || 0;
          const subtotal = qty * row.price;
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-800">
                  {row.name}
                </p>
                <p className="truncate text-[11px] text-gray-500">
                  {row.code || "Sin código"} • ${row.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value || "0", 10);
                    const quantity = isNaN(v) || v < 0 ? 0 : v;
                    if (!row.elementIds.length) return;
                    const [first, ...rest] = row.elementIds;
                    const firstEl = elements.find((el) => el.id === first);
                    if (!firstEl) return;
                    // Asignamos toda la cantidad al primer elemento y 0 al resto.
                    updateElement(first, {
                      data: { ...firstEl.data, quantity },
                    });
                    rest.forEach((id) => {
                      const el = elements.find((e) => e.id === id);
                      if (!el) return;
                      updateElement(id, {
                        data: { ...el.data, quantity: 0 },
                      });
                    });
                  }}
                  className="w-14 rounded border border-gray-300 px-1 py-0.5 text-right text-[11px] focus:border-brand focus:ring-1 focus:ring-brand"
                />
                <span className="text-[11px] text-gray-500">u.</span>
              </div>
              <p className="w-20 text-right text-[11px] font-semibold text-gray-800">
                ${subtotal.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
        <span className="text-[11px] font-semibold text-gray-700">
          Total estimado:
        </span>
        <span className="text-sm font-bold text-brand">
          ${total.toFixed(2)}
        </span>
      </div>
    </section>
  );
}

