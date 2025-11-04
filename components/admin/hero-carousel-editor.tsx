'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

function isVideoUrl(url?: string) {
  if (!url) return false;
  const s = url.toLowerCase();
  return s.endsWith('.mp4') || s.endsWith('.webm') || s.endsWith('.ogg');
}

export default function HeroCarouselEditor({ defaultUrls }: { defaultUrls: string[] }) {
  const initial = (defaultUrls || []).filter(Boolean).slice(0, 3);
  while (initial.length < 3) initial.push('');
  const [items, setItems] = useState<string[]>(initial);
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(i: number) {
    const file = fileRefs[i].current?.files?.[0];
    if (!file) { setError('Selecciona un archivo'); return; }
    setError(null);
    setBusyIndex(i);
    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const baseName = ((file as any).name ? String((file as any).name).toLowerCase() : 'media').replace(/[^a-z0-9._-]+/g, '-');
      const ext = (baseName.match(/\.([a-z0-9]+)$/)?.[1]) || (file.type && file.type.includes('/') ? file.type.split('/')[1] : 'bin');
      const pathname = `uploads/${year}/${month}/${baseName}.${ext}`;
      const res = await upload(pathname, file, { handleUploadUrl: '/api/blob/handle-upload', access: 'public' });
      setItems((prev) => {
        const next = prev.slice();
        next[i] = res.url;
        return next;
      });
    } catch (e: any) {
      try {
        const probe = await fetch('/api/blob/handle-upload', { method: 'GET' });
        const info = await probe.json().catch(() => ({} as any));
        const msg = String(e?.message || '').toLowerCase();
        const noToken = !probe.ok || info?.hasToken === false || msg.includes('client token');
        if (noToken) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('type', 'image');
          const resp = await fetch('/api/upload', { method: 'POST', body: fd });
          const data = await resp.json().catch(() => ({} as any));
          if (!resp.ok || !data?.url) throw new Error(data?.error || 'Upload fallido');
          setItems((prev) => {
            const next = prev.slice();
            next[i] = String(data.url);
            return next;
          });
        } else {
          throw e;
        }
      } catch (e2: any) {
        setError(e2?.message || 'Error al subir');
      }
    } finally {
      setBusyIndex(null);
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j > 2) return;
    setItems((prev) => {
      const next = prev.slice();
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function clearSlot(i: number) {
    setItems((prev) => {
      const next = prev.slice();
      next[i] = '';
      return next;
    });
    const ref = fileRefs[i].current;
    if (ref) ref.value = '';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((url, i) => (
        <div key={i} className="border p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-700 font-medium">Posición #{i + 1}</label>
            <div className="flex gap-2">
              <button type="button" className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => move(i, 1)} disabled={i === 2}>↓</button>
            </div>
          </div>
          <div className="mb-2">
            {url ? (
              isVideoUrl(url) ? (
                <video src={url} className="w-full rounded" controls />
              ) : (
                <img src={url} alt={`hero-${i + 1}`} className="w-full max-h-40 object-cover rounded" />
              )
            ) : (
              <div className="w-full h-40 bg-gray-100 border rounded flex items-center justify-center text-gray-500">Sin archivo</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRefs[i]} type="file" accept="image/*,video/*" className="hidden" onChange={() => onUpload(i)} />
            <button type="button" onClick={() => fileRefs[i].current?.click()} className="px-3 py-1 rounded bg-gray-800 text-white flex-none" disabled={busyIndex === i}>
              {busyIndex === i ? 'Subiendo...' : 'Subir archivo'}
            </button>
            <button type="button" onClick={() => clearSlot(i)} className="px-3 py-1 rounded border flex-none">Limpiar</button>
          </div>
          <input type="hidden" name={`homeHeroUrl${i + 1}`} value={url} />
        </div>
      ))}
      {error && <div className="text-red-600 text-sm col-span-full">{error}</div>}
    </div>
  );
}
