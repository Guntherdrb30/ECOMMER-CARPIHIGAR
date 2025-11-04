'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function HeroMediaUploader({ targetInputName, defaultUrl }: { targetInputName: string; defaultUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ok, setOk] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isVideo = (url: string | undefined) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo'); setOk(false); return; }
    // Detect tipo por mime o extensión
    const name = (file as any).name ? String((file as any).name).toLowerCase() : '';
    const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.ogg'].some((ext) => name.endsWith(ext));
    const isImage = file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.svg'].some((ext) => name.endsWith(ext));
    if (!(isVideo || isImage)) {
      setError('Formato no permitido. Usa PNG, JPG, WEBP, SVG, MP4, WEBM u OGG.');
      setOk(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    setOk(false);
    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const baseName = ((file as any).name ? String((file as any).name).toLowerCase() : 'media').replace(/[^a-z0-9._-]+/g, '-');
      const ext = (baseName.match(/\.([a-z0-9]+)$/)?.[1]) || (file.type && file.type.includes('/') ? file.type.split('/')[1] : 'bin');
      const pathname = `uploads/${year}/${month}/${baseName}.${ext}`;

      const res = await upload(pathname, file, {
        handleUploadUrl: '/api/blob/handle-upload',
        access: 'public',
      });
      setPreview(res.url);
      const input = document.querySelector<HTMLInputElement>(`input[name="${targetInputName}"]`);
      if (input) input.value = res.url;
      setOk(true);
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
          setPreview(String(data.url));
          const input = document.querySelector<HTMLInputElement>(`input[name="${targetInputName}"]`);
          if (input) input.value = String(data.url);
          setOk(true);
          setError(undefined);
        } else {
          throw e;
        }
      } catch (e2: any) {
        setError(e2?.message || 'Error al subir archivo');
        setOk(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async () => {
    if (fileRef.current?.files?.length) {
      await handleUpload();
    }
  };

  return (
    <div className="space-y-2">
      {preview && (
        isVideo(preview) ? (
          <video src={preview} className="w-full rounded" controls />
        ) : (
          <img src={preview} alt="Preview" className="w-full max-h-40 object-cover rounded" />
        )
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleChange} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 flex-none" disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir archivo'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Formatos: PNG, JPG, WEBP, SVG, MP4, WEBM, OGG.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && !error && <div className="text-green-700 text-sm">Archivo subido</div>}
    </div>
  );
}
