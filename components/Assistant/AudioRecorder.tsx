"use client";
import React, { useState } from "react";
import { useAudioRecorder } from "./hooks/useAudioRecorder";

export default function AudioRecorder({ onSend }: { onSend: (base64: string) => Promise<void> | void }) {
  const { recording, start, stop, permissionError } = useAudioRecorder();
  const [sending, setSending] = useState(false);
  const onClick = async () => {
    if (!recording) {
      await start();
    } else {
      const base64 = await stop();
      if (base64) {
        setSending(true);
        try { await onSend(base64); } finally { setSending(false); }
      }
    }
  };
  return (
    <button
      aria-label="Grabar audio"
      disabled={sending}
      onClick={onClick}
      className={`px-3 py-2 rounded-full ${recording ? 'bg-red-600 text-white' : 'bg-gray-200'} ${sending ? 'opacity-60' : ''}`}
      title={recording ? 'Detener y enviar' : 'Grabar'}
    >
      {recording ? '●' : '🎤'}
    </button>
  );
}

