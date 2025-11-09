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
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistantCtx(): Ctx {
  const v = useContext(AssistantContext);
  if (!v) throw new Error("useAssistantCtx must be used within AssistantProvider");
  return v;
}

