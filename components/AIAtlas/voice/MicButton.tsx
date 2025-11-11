"use client";

import { useState } from 'react';
import { useVoiceRecorder } from './useVoiceRecorder';
import { useAssistant } from '../hooks/useAssistant';

export default function MicButton() {
  const { recording, start, stop } = useVoiceRecorder();
  const { sendText } = useAssistant();
  const [busy, setBusy] = useState(false);

  const handlePress = async () => { if (!recording) await start(); };
  const handleRelease = async () => {
    if (!recording || busy) return;
    setBusy(true);
    try {
      const blob = await stop();
      if (!blob) return;
      const fd = new FormData();
      fd.append('file', new File([blob], 'voice.webm', { type: 'audio/webm' }));
      const res = await fetch('/api/voice/stt', { method: 'POST', body: fd });
      const json = await res.json();
      const text = String(json?.text || '').trim();
      if (text) await sendText(text);
    } finally { setBusy(false); }
  };

  return (
    <button onMouseDown={handlePress} onMouseUp={handleRelease} onTouchStart={handlePress} onTouchEnd={handleRelease}
      className={`mt-2 px-4 py-2 rounded-full ${recording ? 'bg-[#E62C1A] text-white animate-pulse' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
      aria-label="Mantén presionado para hablar">
      {recording ? 'Grabando…' : 'Hablar'}
    </button>
  );
}
