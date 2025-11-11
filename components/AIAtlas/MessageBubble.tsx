"use client";

import React from 'react';

export default function MessageBubble({ role, children }: { role: 'user'|'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} my-1`}>
      <div className={`${isUser ? 'bg-[#E62C1A] text-white' : 'bg-[#F8F8F8] text-gray-900'} max-w-[80%] rounded-2xl px-3 py-2 shadow-sm`}>{children}</div>
    </div>
  );
}

