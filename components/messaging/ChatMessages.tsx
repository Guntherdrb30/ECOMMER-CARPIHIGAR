"use client";
import { useEffect, useRef, useState } from 'react';

type Msg = {
  id: string;
  direction: 'IN' | 'OUT' | string;
  type?: string;
  text?: string | null;
  mediaUrl?: string | null;
  createdAt: string;
};

export default function ChatMessages({ conversationId, initial }: { conversationId: string; initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial || []);
  const [preview, setPreview] = useState<{ url: string; kind: 'image' | 'video' } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    let timer: any;
    const tick = async () => {
      try {
        const res = await fetch(`/api/messaging/conversations/${conversationId}/messages`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.ok && Array.isArray(json.messages)) {
          const next: Msg[] = json.messages;
          const lastLocal = messages[messages.length - 1]?.id;
          const lastRemote = next[next.length - 1]?.id;
          if (lastLocal !== lastRemote || next.length !== messages.length) {
            setMessages(next);
          }
        }
      } catch {}
      timer = setTimeout(tick, 3000);
    };
    timer = setTimeout(tick, 3000);
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

  const renderBubbleContent = (m: Msg) => {
    const type = String(m.type || 'TEXT').toUpperCase();
    const media = m.mediaUrl || '';
    // Fallback: detect media link in text when mediaUrl is missing
    let fallbackUrl: string | null = null;
    let fallbackKind: 'image' | 'video' | null = null;
    if (!media && m.text) {
      const urlMatch = String(m.text).match(/https?:\/\/\S+/i);
      const url = urlMatch?.[0];
      if (url) {
        const lower = url.toLowerCase();
        if (/(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.svg)(\?|#|$)/.test(lower)) {
          fallbackUrl = url; fallbackKind = 'image';
        } else if (/(\.mp4|\.mov|\.webm|\.m4v)(\?|#|$)/.test(lower)) {
          fallbackUrl = url; fallbackKind = 'video';
        }
      }
    }
    const showUrl = media || fallbackUrl || '';
    const kind: 'image' | 'video' | null = media ? (type === 'VIDEO' ? 'video' : type === 'IMAGE' ? 'image' : null) : fallbackKind;
    if (showUrl && kind) {
      return (
        <div className="space-y-2">
          <div className="text-[13px] text-gray-700 whitespace-pre-wrap">{m.text}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-gray-800 text-white"
              onClick={() => setPreview({ url: showUrl, kind })}
            >
              Ver
            </button>
          </div>
        </div>
      );
    }
    const text = String(m.text || '');
    const parts = text.split(/(https?:\/\/\S+)/g);
    return (
      <div className="text-[15px] leading-5 whitespace-pre-wrap text-gray-900">
        {parts.map((part, idx) => {
          if (/^https?:\/\/\S+$/i.test(part)) {
            return (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline break-all"
              >
                {part}
              </a>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <>
      <div ref={boxRef} className="flex-1 overflow-auto p-3 space-y-2 bg-[#efeae2]">
        {messages.map((m) => {
          const isOut = String(m.direction) === 'OUT';
          const bubble = isOut ? 'bg-[#DCF8C6] border border-green-200 ml-auto' : 'bg-white border border-gray-200';
          return (
            <div key={m.id} className={`max-w-[85%] px-3 py-2 rounded-2xl ${bubble}`}>
              {renderBubbleContent(m)}
              <div className="text-[10px] mt-1 text-gray-500 flex items-center gap-1 justify-end">
                {new Date(m.createdAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded shadow-lg p-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-sm">Adjunto</div>
              <button className="text-sm px-2 py-1 border rounded" onClick={() => setPreview(null)}>Cerrar</button>
            </div>
            <div className="max-h-[70vh] max-w-[80vw]">
              {preview.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="Adjunto" className="max-h-[70vh] max-w-[80vw] object-contain" />
              ) : (
                <video src={preview.url} controls className="max-h-[70vh] max-w-[80vw]" />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <a href={preview.url} download className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Descargar</a>
              <a href={preview.url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded border text-sm">Abrir en pestaña</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
