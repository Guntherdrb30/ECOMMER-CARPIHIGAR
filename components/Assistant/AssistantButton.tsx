"use client";
import React from "react";
import { useAssistant } from "./hooks/useAssistant";

export default function AssistantButton() {
  const a = useAssistant();
  const open = () => a.setOpen(true);
  // Hide on admin/dashboard
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) return null;
  return (
    <button
      onClick={open}
      className="fixed z-50 bottom-4 right-4 h-14 w-14 rounded-full atlas-button flex items-center justify-center atlas-shadow"
      aria-label="Abrir asistente"
    >
      💬
    </button>
  );
}

