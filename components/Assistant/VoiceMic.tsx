"use client";
import React, { useEffect } from "react";
import { useAssistantCtx } from "./AssistantProvider";
import { useVoiceSession } from "./hooks/useVoiceSession";
import { speak, stopSpeaking } from "./hooks/speech";

export default function VoiceMic() {
  const a = useAssistantCtx();
  const onFinal = async (text: string) => {
    if (!text?.trim()) return;
    await a.sendMessage(text);
    // Enable TTS during a voice session
    a.setTtsEnabled(true);
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
      {v.listening ? '●' : '🎤'}
    </button>
  );
}

