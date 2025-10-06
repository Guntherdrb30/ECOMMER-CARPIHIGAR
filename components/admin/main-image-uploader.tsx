'use client';

import { useState, useRef } from 'react';

export default function MainImageUploader({ targetName = 'mainImage' }: { targetName?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (json.url) setUrl(json.url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {url && (
        <div className="w-32 h-32 border rounded overflow-hidden">
          <img src={url} alt="main" className="w-full h-full object-cover" />
          <input type="hidden" name={targetName} value={url} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} />
        <button type="button" onClick={() => onFile(fileRef.current?.files?.[0] || null)} disabled={busy} className="px-3 py-1 rounded border">
          {busy ? 'Subiendo...' : (url ? 'Reemplazar' : 'Subir')}
        </button>
      </div>
    </div>
  );
}

