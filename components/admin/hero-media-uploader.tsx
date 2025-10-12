'use client';

import { useState, useRef } from 'react';

export default function HeroMediaUploader({ targetInputName, defaultUrl }: { targetInputName: string; defaultUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ok, setOk] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isVideo = (url: string) => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo'); setOk(false); return; }
    
    const allowedImage = ['image/png','image/jpeg','image/webp','image/svg+xml'];
    const allowedVideo = ['video/mp4', 'video/webm'];
    const name = (file as any).name ? String((file as any).name).toLowerCase() : '';
    const okImageExt = ['.png','.jpg','.jpeg','.webp','.svg'].some((ext) => name.endsWith(ext));
    const okVideoExt = ['.mp4','.webm'].some((ext) => name.endsWith(ext));

    if (!(allowedImage.includes(file.type) || okImageExt || allowedVideo.includes(file.type) || okVideoExt)) {
      setError('Formato no permitido. Usa PNG, JPG, WEBP, SVG, MP4 o WEBM.');
      setOk(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    setOk(false);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Error al subir archivo');
        return;
      }
      if (json.url) {
        setPreview(json.url);
        const input = document.querySelector<HTMLInputElement>(`input[name="${targetInputName}"]`);
        if (input) input.value = json.url;
        setOk(true);
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
          <video src={preview} className="h-24 w-auto" controls />
        ) : (
          <img src={preview} alt="Preview" className="h-24 w-auto" />
        )
      )}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleChange} />
        <button type="button" onClick={handleUpload} className="px-3 py-1 rounded bg-gray-800 text-white" disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Formatos: PNG, JPG, WEBP, SVG, MP4, WEBM.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && !error && <div className="text-green-700 text-sm">Archivo subido</div>}
    </div>
  );
}
