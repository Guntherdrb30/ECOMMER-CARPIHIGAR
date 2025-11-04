'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

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
      const filesArr = Array.from(files);
      const available = typeof max === 'number' ? Math.max(0, max - urls.length) : filesArr.length;
      const limited = filesArr.slice(0, available);
      const tryServerFallback = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'image');
        const resp = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await resp.json().catch(() => ({} as any));
        if (!resp.ok || !data?.url) throw new Error(data?.error || 'Upload fallido');
        return data.url as string;
      };

      for (const file of limited) {
        if (max && (urls.length + next.length) >= max) break;
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const nameGuess = (file as any).name ? String((file as any).name).toLowerCase() : '';
        let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || '';
        if (!ext) ext = (file.type && file.type.includes('/')) ? file.type.split('/')[1] : 'bin';
        const base = (nameGuess || 'image').replace(/[^a-z0-9._-]+/g, '-');
        const pathname = `uploads/${year}/${month}/${base}.${ext}`;

        try {
          const res = await upload(pathname, file, {
            handleUploadUrl: '/api/blob/handle-upload',
            access: 'public',
          });
          next.push(res.url);
        } catch (err: any) {
          try {
            const probe = await fetch('/api/blob/handle-upload', { method: 'GET' });
            const info = await probe.json().catch(() => ({} as any));
            if (!probe.ok || info?.hasToken === false || String(err?.message || '').toLowerCase().includes('client token')) {
              const url = await tryServerFallback(file);
              next.push(url);
            } else {
              throw err;
            }
          } catch (e) {
            throw e;
          }
        }
      }
      setUrls((prev) => [...prev, ...next]);
    } catch (e: any) {
      console.error('[ImagesUploader] upload error', e);
      try {
        const probe = await fetch('/api/blob/handle-upload', { method: 'GET' });
        const info = await probe.json().catch(() => ({} as any));
        if (!probe.ok || info?.hasToken === false) {
          setError('Falta configurar BLOB_READ_WRITE_TOKEN en Vercel para subir archivos.');
        } else {
          setError(e?.message || 'Error al subir imagenes');
        }
      } catch {
        setError(e?.message || 'Error al subir imagenes');
      }
    } finally {
      setBusy(false);
    }
  };

  const reached = !!max && urls.length >= max;

  return (
    <div className="space-y-2">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {typeof max === 'number' && (
        <div className="text-xs text-gray-600">{urls.length}/{max} imÃ¡genes</div>
      )}
      <div className="flex gap-2 flex-wrap">
        {urls.map((u) => (
          <div key={u} className="relative w-16 h-16 border rounded overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="img" className="w-full h-full object-cover" />
            <input type="hidden" name={targetName} value={u} />
            <button
              type="button"
              aria-label="Quitar imagen"
              onClick={() => {
                if (window.confirm('Â¿Quitar esta imagen?')) {
                  setUrls((prev) => prev.filter((x) => x !== u));
                }
              }}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded px-1 text-[10px] opacity-0 group-hover:opacity-100 transition"
              title="Quitar"
            >
              Ã—
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          disabled={reached}
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || reached}
          className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700"
        >
          {busy ? 'Subiendo...' : 'Subir archivo'}
        </button>
        {reached && (
          <span className="text-xs text-gray-500">LÃ­mite alcanzado</span>
        )}
      </div>
    </div>
  );
}




