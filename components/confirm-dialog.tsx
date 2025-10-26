"use client";

import React from "react";

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message = "¿Estás seguro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="px-4 py-4 text-sm text-gray-700">
            {message}
          </div>
          <div className="px-4 py-3 border-t flex gap-2 justify-end">
            <button onClick={onClose} className="px-3 py-1.5 rounded border text-gray-700 hover:bg-gray-50">{cancelText}</button>
            <button onClick={onConfirm} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

