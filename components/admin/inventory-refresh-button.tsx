"use client";

export default function InventoryRefreshButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try { window.dispatchEvent(new Event('inventory-refresh')); } catch {}
      }}
      className="px-3 py-1 border rounded text-sm"
    >
      Actualizar datos
    </button>
  );
}

