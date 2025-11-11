"use client";

import { useEffect, useRef } from 'react';
import { useAssistant, AssistantMessage } from './hooks/useAssistant';
import MessageBubble from './MessageBubble';
import ProductCard from './ProductCard';
import CartView from './CartView';
import AddressForm from './AddressForm';
import PaymentForm from './PaymentForm';

function renderAssistantContent(m: AssistantMessage) {
  if (m.type === 'text') return (<div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>);
  if (m.type === 'audio' && m.audioBase64) return (<audio controls src={m.audioBase64} className="w-full" />);
  if (m.type === 'products' && Array.isArray(m.data)) {
    return (
      <div className="space-y-2">
        {m.data.map((p: any) => (<ProductCard key={p.id} product={p} />))}
      </div>
    );
  }
  if (m.type === 'cart') return (<CartView />);
  if (m.type === 'address') return (<AddressForm />);
  return (<div className="text-sm text-gray-700">Contenido no soportado</div>);
}

export default function ChatWindow() {
  const { messages, view } = useAssistant();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="h-full overflow-y-auto aiatlas-scroll px-3 py-2">
      <div className="space-y-1">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role === 'user' ? 'user' : 'assistant'}>
            {m.role === 'assistant' ? renderAssistantContent(m) : (<div className="whitespace-pre-wrap text-sm">{m.content}</div>)}
          </MessageBubble>
        ))}
        {/* View control area */}
        {view === 'cart' && (
          <MessageBubble role="assistant"><CartView /></MessageBubble>
        )}
        {view === 'address' && (
          <MessageBubble role="assistant"><AddressForm /></MessageBubble>
        )}
        {view === 'payment_steps' && (
          <MessageBubble role="assistant"><PaymentForm /></MessageBubble>
        )}
      </div>
      <div ref={endRef} />
    </div>
  );
}
