"use client";
import React from "react";
import { useAssistantCtx } from "./AssistantProvider";
import { AssistantContent } from "./hooks/useAssistant";

export default function MessageBubble({ from, content, onAction }: { from: "user"|"agent"; content: AssistantContent; onAction?: (key: string) => void; }) {
  const { ttsEnabled } = useAssistantCtx();
  const isUser = from === 'user';
  const bubble = isUser ? 'bg-[#E9FCE9] border border-green-200' : 'bg-white border border-gray-200';
  return (
    <div className={`max-w-[85%] px-3 py-2 rounded-2xl ${bubble} ${isUser ? 'ml-auto' : ''}`}>
      {content.type === 'text' && (
        <div className="text-[15px] leading-5 whitespace-pre-wrap text-gray-900">{content.message}</div>
      )}
      {ttsEnabled && (content.type === 'voice' || !!content.audioBase64) && content.audioBase64 && (
        <audio controls autoPlay className="w-full">
          <source src={`data:audio/webm;base64,${content.audioBase64}`} />
        </audio>
      )}
      {!!content.actions?.length && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {content.actions.map(a => (
            <button key={a.key} className="px-3 py-1 rounded border text-sm hover:bg-gray-50" onClick={() => onAction?.(a.key)}>{a.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
