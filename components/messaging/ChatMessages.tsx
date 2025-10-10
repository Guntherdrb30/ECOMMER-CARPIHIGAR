"use client";
import { useEffect, useRef, useState } from 'react';

type Msg = { id: string; direction: 'IN'|'OUT'|string; text?: string|null; createdAt: string };

export default function ChatMessages({ conversationId, initial }: { conversationId: string; initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial || []);
  const boxRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = boxRef.current; if (!el) return; el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    let timer: any;
    const tick = async () => {
      try {
        const res = await fetch(`/api/messaging/conversations/${conversationId}/messages`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.ok && Array.isArray(json.messages)) {
          const sameLength = json.messages.length === messages.length;
          const lastLocal = messages[messages.length - 1]?.id;
          const lastRemote = json.messages[json.messages.length - 1]?.id;
          if (!sameLength || lastLocal !== lastRemote) setMessages(json.messages);
        }
      } catch {}
      timer = setTimeout(tick, 3000);
    };
    timer = setTimeout(tick, 3000);
    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return (
    <div ref={boxRef} className="flex-1 overflow-auto p-3 space-y-2 bg-[#efeae2]">
      {messages.map((m) => {
        const isOut = String(m.direction) === 'OUT';
        const bubble = isOut ? 'bg-[#DCF8C6] border border-green-200 ml-auto' : 'bg-white border border-gray-200';
        return (
          <div key={m.id} className={`max-w-[85%] px-3 py-2 rounded-2xl ${bubble}`}>
            <div className="text-[15px] leading-5 whitespace-pre-wrap text-gray-900">{m.text}</div>
            <div className="text-[10px] mt-1 text-gray-500 flex items-center gap-1 justify-end">
              {new Date(m.createdAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

