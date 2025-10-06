"use client";

import { useState } from "react";

type HiddenFields = Record<string, string>;

export default function SecretDeleteButton({
  action,
  hidden,
  label = "Eliminar",
  title = "Confirmar eliminación",
  description = "Esta acción es permanente. Ingresa la clave secreta para continuar.",
  secretName = "secret",
  className,
}: {
  action: any;
  hidden: HiddenFields;
  label?: string;
  title?: string;
  description?: string;
  secretName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className || "text-red-600 hover:underline"} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded shadow-lg w-full max-w-md mx-4 p-4">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <form action={action} className="space-y-3" onSubmit={() => setOpen(false)}>
              {Object.entries(hidden || {}).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <div>
                <label className="block text-sm text-gray-700">Clave secreta</label>
                <input name={secretName} type="password" required className="border rounded px-2 py-1 w-full" placeholder="Escribe la clave" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-3 py-1 border rounded" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="px-3 py-1 bg-red-600 text-white rounded">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

