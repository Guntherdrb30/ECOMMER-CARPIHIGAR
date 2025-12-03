"use client";

import { useState } from 'react';
import { useVoiceRecorder } from './useVoiceRecorder';
import { useAssistant } from '../hooks/useAssistant';

function cleanSttText(raw: string): string {
  try {
    const t = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!t) return t;
    const words = t.split(' ');
    // Caso: frase duplicada completa ("hola mesa hola mesa")
    if (words.length % 2 === 0) {
      const half = words.length / 2;
      const first = words.slice(0, half).join(' ').toLowerCase();
      const second = words.slice(half).join(' ').toLowerCase();
      if (first === second) return words.slice(0, half).join(' ');
    }
    // Caso: palabras repetidas seguidas ("hola hola mesa")
    const out: string[] = [];
    for (const w of words) {
      const last = out[out.length - 1];
      if (last && last.toLowerCase() === w.toLowerCase()) continue;
      out.push(w);
    }
    return out.join(' ');
  } catch {
    return raw;
  }
}

export default function MicButton() {
  const { recording, start, stop } = useVoiceRecorder();
  const { sendText } = useAssistant();
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    if (!recording) await start();
  };

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
      const raw = String(json?.text || '').trim();
      const text = cleanSttText(raw);
      if (text) await sendText(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onPointerDown={handlePress}
      onPointerUp={handleRelease}
      onPointerLeave={handleRelease}
      className={`mt-2 px-4 py-2 rounded-full ${
        recording ? 'bg-[#E62C1A] text-white animate-pulse' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }`}
      aria-label="Mantén presionado para hablar"
    >
      {recording ? 'Grabando…' : 'Hablar'}
    </button>
  );
}

