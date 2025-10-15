'use client';

import { useState, useRef } from 'react';

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
      // 1) Pedir URL de subida directa (Vercel Blob)
      const urlRes = await fetch('/api/blob/upload-url', { method: 'POST' });
      const { url } = await urlRes.json();
      if (!urlRes.ok || !url) {
        setError('No se pudo crear URL de carga');
        return;
      }
      // 2) Subir directo a Blob
      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      const uploaded = await put.json().catch(() => ({} as any));
      if (!put.ok) {
        setError((uploaded as any)?.error || 'Upload failed');
        return;
      }
      const finalUrl = (uploaded as any)?.url || url.split('?')[0];
      setPreview(finalUrl);
      const input = document.querySelector<HTMLInputElement>(`input[name="${targetInputName}"]`);
      if (input) input.value = finalUrl;
      setOk(true);
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
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleChange} className="flex-1 min-w-0 max-w-full" />
        <button type="button" onClick={handleUpload} className="px-3 py-1 rounded bg-gray-800 text-white flex-none" disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Formatos: PNG, JPG, WEBP, SVG, MP4, WEBM, OGG.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && !error && <div className="text-green-700 text-sm">Archivo subido</div>}
    </div>
  );
}
