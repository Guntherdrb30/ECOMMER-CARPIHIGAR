"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAssistantCtx } from "./AssistantProvider";
import { useVoiceSession } from "./hooks/useVoiceSession";
import { speak, stopSpeaking } from "./hooks/speech";

export default function VoiceMic() {
  const a = useAssistantCtx();
  const bufferRef = useRef<string>("");
  const timerRef = useRef<any>(null);
  const [pending, setPending] = useState(false);
  const onFinal = async (text: string) => {
    const t = String(text || '').trim();
    if (!t) return;
    bufferRef.current = bufferRef.current ? `${bufferRef.current} ${t}` : t;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPending(true);
    timerRef.current = setTimeout(async () => {
      const finalText = bufferRef.current.trim();
      bufferRef.current = "";
      setPending(false);
      if (finalText) {
        await a.sendMessage(finalText);
        a.setTtsEnabled(true);
      }
    }, 700);
  };
  const v = useVoiceSession(onFinal);

  useEffect(() => {
    // When we stop listening, we can keep TTS enabled. Optional.
    return () => { a.setTtsEnabled(false); stopSpeaking(); };
  }, []);

  const toggle = () => {
    if (v.listening) { v.stop(); a.setTtsEnabled(false); }
    else { v.start(); a.setTtsEnabled(true); }
  };

  return (
    <button
      onClick={toggle}
      className={`px-3 py-2 rounded-full ${v.listening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200'}`}
      title={v.listening ? 'Detener' : 'Hablar'}
      aria-pressed={v.listening}
      aria-label="Hablar con el asistente"
    >
      {pending ? '…' : (v.listening ? '●' : '🎤')}
    </button>
  );
}
