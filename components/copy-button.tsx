"use client";

import { useState } from 'react';

export default function CopyButton({ text, className, children }: { text: string; className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <button type="button" onClick={onCopy} className={className || 'px-2 py-1 border rounded text-sm'}>
      {copied ? 'Copiado!' : (children || 'Copiar')}
    </button>
  );
}

