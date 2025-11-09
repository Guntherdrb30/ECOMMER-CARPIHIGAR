"use client";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "./ChatWindow";
import { useAssistant } from "./hooks/useAssistant";
import AudioRecorder from "./AudioRecorder";

export default function AtlasPanel() {
  const a = useAssistant();
  const [text, setText] = useState("");
  const close = () => a.setOpen(false);
  const send = async () => { if (!text.trim()) return; const t = text; setText(""); await a.sendMessage(t); };
  const onAction = async (key: string) => {
    try { await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) }); } catch {}
  };

  const width = typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : '420px';

  return (
    <AnimatePresence>
      {a.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60]"
        >
          <div className="absolute inset-0 bg-black/35" onClick={close} />
          <motion.div
            initial={{ x: 500 }}
            animate={{ x: 0 }}
            exit={{ x: 500 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="absolute right-0 top-0 h-full atlas-panel atlas-shadow flex flex-col"
            style={{ width }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-white rounded-tl-[16px]">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-default.svg" className="h-6 w-auto" alt="Carpihogar" />
                <span className="font-semibold">Asistente</span>
              </div>
              <button onClick={close} className="px-2 py-1 rounded border text-sm">Cerrar</button>
            </div>

            {/* Chat */}
            <ChatWindow messages={a.messages} onAction={onAction} />

            {/* Footer */}
            <div className="p-3 border-t bg-white flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-full px-4 py-2 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <AudioRecorder onSend={(b64) => a.sendAudio(b64)} />
              <button className="px-3 py-2 rounded-full atlas-button" onClick={send} disabled={a.loading}>Enviar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
