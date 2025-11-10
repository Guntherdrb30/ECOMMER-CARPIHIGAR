"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { useAssistant } from "./hooks/useAssistant";

type Ctx = ReturnType<typeof useAssistant> & {
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
};

const AssistantContext = createContext<Ctx | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const a = useAssistant();
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const value = useMemo(() => ({ ...a, ttsEnabled, setTtsEnabled }), [a, ttsEnabled]);
  // Sincroniza un flag global para que otros hooks puedan consultarlo sin contexto
  // Solo activa TTS cuando el usuario habilita el micrófono/voz
  if (typeof window !== 'undefined') {
    (window as any).__assistant_tts_enabled = ttsEnabled === true;
  }
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistantCtx(): Ctx {
  const v = useContext(AssistantContext);
  if (!v) throw new Error("useAssistantCtx must be used within AssistantProvider");
  return v;
}
