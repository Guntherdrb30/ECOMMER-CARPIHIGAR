'use client';

import { useState, useRef } from 'react';

export default function ImagesUploader({ targetName = 'images[]', max }: { targetName?: string, max?: number }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const next: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (max && (urls.length + next.length) >= max) break;
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Error ${res.status}: ${t}`);
        }
        const json = await res.json();
        if (json.url) next.push(json.url);
      }
      setUrls((prev) => [...prev, ...next]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 flex-wrap">
        {urls.map((u) => (
          <div key={u} className="w-16 h-16 border rounded overflow-hidden">
            <img src={u} alt="img" className="w-full h-full object-cover" />
            <input type="hidden" name={targetName} value={u} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => onFiles(e.target.files)} />
        <button type="button" onClick={() => onFiles(fileRef.current?.files || null)} disabled={busy} className="px-3 py-1 rounded border">
          {busy ? 'Subiendo...' : 'Subir seleccionadas'}
        </button>
      </div>
    </div>
  );
}
