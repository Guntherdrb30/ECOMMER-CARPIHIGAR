"use client";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "./ChatWindow";
import { useAssistantCtx } from "./AssistantProvider";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import VoiceMic from "./VoiceMic";

export default function AtlasPanel() {
  const a = useAssistantCtx();
  const [text, setText] = useState("");
  const close = () => a.setOpen(false);
  const send = async () => { if (!text.trim()) return; const t = text; setText(""); await a.sendMessage(t); };
  const onAction = async (key: string) => {
    try {
      const r = await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      if (key === 'start_checkout') {
        try { window.location.href = '/checkout/revisar'; } catch {}
      }
    } catch {}
  };

  const width = typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : '420px';
  const [uploading, setUploading] = useState(false);
  const fileInputId = 'assistant-proof-file';

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
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const r = await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'view_cart' }) });
                      const j = await r.json();
                      if (j?.cart) {
                        a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'rich', message: 'Tu carrito', cart: j.cart } } as any);
                      }
                    } catch {}
                  }}
                  className="relative p-2 rounded border text-sm"
                  title="Ver carrito"
                  aria-label="Ver carrito"
                >
                  <ShoppingCart size={16} />
                  {(() => { try { const n = useCartStore.getState().getTotalItems(); return n > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-[var(--color-brand)] text-white text-[10px] rounded-full px-1.5 py-[1px]">{n}</span>
                  ) : null; } catch { return null; } })()}
                </button>
                <button onClick={() => a.reset()} className="px-2 py-1 rounded border text-sm" title="Vaciar conversación">Vaciar</button>
                <button onClick={close} className="px-2 py-1 rounded border text-sm">Cerrar</button>
              </div>
            </div>

            {/* Chat */}
            <ChatWindow messages={a.messages} onAction={async (key) => {
              if (key === 'view_cart') {
                try {
                  const r = await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'view_cart' }) });
                  const j = await r.json();
                  if (j?.cart) a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'rich', message: 'Tu carrito', cart: j.cart } } as any);
                } catch {}
                return;
              }
              if (key === 'choose_method_zelle' || key === 'choose_method_pm' || key === 'choose_method_transfer' || key === 'choose_method_store') {
                const method = key === 'choose_method_zelle' ? 'Zelle' : key === 'choose_method_pm' ? 'Pago Móvil' : key === 'choose_method_transfer' ? 'Transferencia Bancaria' : 'Pago en Tienda';
                try {
                  // cache in localStorage to prefill checkout later
                  try { localStorage.setItem('assistant:paymentMethod', method); } catch {}
                  const r = await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'choose_payment_method', method }) });
                  const j = await r.json();
                  if (j?.order) {
                    a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'rich', message: `Instrucciones de ${method}:`, order: j.order } } as any);
                  } else {
                    a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'text', message: `Usaremos ${method}.` } } as any);
                  }
                } catch {}
                return;
              }
              try {
                const r = await fetch('/api/assistant/ui-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
                if (key === 'start_checkout') {
                  try { window.location.href = '/checkout/revisar'; } catch {}
                }
              } catch {}
            }} />

            {/* Footer */}
            <div className="p-3 border-t bg-white flex items-center gap-2">
              <input id={fileInputId} type="file" accept="image/*" hidden onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  const fd = new FormData();
                  fd.append('file', f);
                  const r = await fetch('/api/assistant/upload-proof', { method: 'POST', body: fd });
                  const j = await r.json();
                  if (j?.ok) {
                    const { parsed, submitted } = j;
                    a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'text', message: submitted?.ok ? 'Recibí tu comprobante y registré el pago. ¿A dónde deseas que enviemos tu compra? Por favor, indícame tu dirección.' : 'Recibí tu comprobante. ¿A dónde deseas que enviemos tu compra? Por favor, indícame tu dirección.' } });
                  } else {
                    a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'text', message: 'No pude leer el soporte de pago. ¿Puedes intentar con una imagen más clara o ingresar el monto y la referencia?' } });
                  }
                } catch {
                  a.append({ id: crypto.randomUUID(), from: 'agent', at: Date.now(), content: { type: 'text', message: 'Hubo un problema al subir tu soporte. Intenta nuevamente.' } });
                } finally {
                  setUploading(false);
                  try { (e.currentTarget as any).value = ''; } catch {}
                }
              }} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-full px-4 py-2 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button className={`px-3 py-2 rounded-full ${uploading ? 'opacity-60' : 'atlas-button-alt'}`} onClick={() => { try { (document.getElementById(fileInputId) as HTMLInputElement)?.click(); } catch {} }} disabled={uploading} title="Adjuntar soporte">
                {uploading ? 'Subiendo…' : 'Adjuntar'}
              </button>
              <VoiceMic />
              <button className="px-3 py-2 rounded-full atlas-button" onClick={send} disabled={a.loading}>Enviar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
