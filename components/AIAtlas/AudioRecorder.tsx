"use client";

import { useAudioRecorder } from './hooks/useAudioRecorder';

export default function AudioRecorder({ onSend }: { onSend: (audioBase64: string) => void }) {
  const { recording, start, stop } = useAudioRecorder();
  const toggle = async () => {
    if (!recording) { await start(); } else { const b64 = await stop(); if (b64) onSend(b64); }
  };
  return (
    <button onClick={toggle} className={`p-2 rounded ${recording ? 'bg-red-600 animate-pulse text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`} aria-label="Grabar audio">
      {recording ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M6 8a6 6 0 1112 0v2a6 6 0 11-12 0V8z"/><path d="M5 10a7 7 0 0014 0h-2a5 5 0 11-10 0H5z"/><path d="M13 19.938V22h-2v-2.062A9.005 9.005 0 013 11h2a7 7 0 0014 0h2a9.005 9.005 0 01-8 8.938z"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 006.75-6.75m-13.5 0a6.75 6.75 0 006.75 6.75m0 0V22m0-3.25a6.75 6.75 0 01-6.75-6.75V8.25a6.75 6.75 0 1113.5 0v3.75a6.75 6.75 0 01-6.75 6.75z"/></svg>
      )}
    </button>
  );
}

