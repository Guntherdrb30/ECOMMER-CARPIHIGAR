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
        const urlRes = await fetch('/api/blob/upload-url', { method: 'POST' });
        const { url } = await urlRes.json();
        if (!urlRes.ok || !url) {
          throw new Error('No se pudo crear URL de carga');
        }
        const put = await fetch(url, {
          method: 'PUT',
          headers: { 'content-type': file.type || 'application/octet-stream' },
          body: file,
        });
        const uploaded = await put.json().catch(() => ({} as any));
        if (!put.ok) {
          throw new Error((uploaded as any)?.error || 'Error al subir');
        }
        const finalUrl = (uploaded as any)?.url || url.split('?')[0];
        next.push(finalUrl);
      }
      setUrls((prev) => [...prev, ...next]);
    } catch (e: any) {
      console.error('[ImagesUploader] upload error', e);
      setError(e?.message || 'Error al subir imágenes');
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

