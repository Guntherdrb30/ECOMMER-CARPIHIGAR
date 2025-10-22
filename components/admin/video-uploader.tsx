'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function VideoUploader({ targetInputName, defaultUrl }: { targetInputName: string; defaultUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ok, setOk] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo'); setOk(false); return; }
    // Client-side validation
    const MAX = 50 * 1024 * 1024; // 50MB
    const allowed = ['video/mp4', 'video/webm', 'video/ogg'];
    const name = (file as any).name ? String((file as any).name).toLowerCase() : '';
    const okExt = ['.mp4','.webm','.ogg'].some((ext) => name.endsWith(ext));
    if (file.size > MAX) {
      setError('Archivo demasiado grande (máx 50MB)');
      setOk(false);
      return;
    }
    if (!(allowed.includes(file.type) || okExt)) {
      setError('Formato no permitido. Usa MP4, WEBM o OGG.');
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
      const nameGuess = (file as any).name ? String((file as any).name).toLowerCase() : '';
      let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || '';
      if (!ext) ext = (file.type && file.type.includes('/')) ? file.type.split('/')[1] : 'bin';
      const base = (nameGuess || 'video').replace(/[^a-z0-9._-]+/g, '-');
      const pathname = `uploads/${year}/${month}/${base}.${ext}`;

      const res = await upload(pathname, file, {
        handleUploadUrl: '/api/blob/handle-upload',
        access: 'public',
      });
      setPreview(res.url);
      const input = document.querySelector<HTMLInputElement>(`input[name="${targetInputName}"]`);
      if (input) input.value = res.url;
      setOk(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async () => {
    // Autocargar en cuanto se seleccione el archivo
    if (fileRef.current?.files?.length) {
      await handleUpload();
    }
  };

  return (
    <div className="space-y-2">
      {preview && (
        <video src={preview} controls className="w-full rounded-lg" />
      )}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="video/*" onChange={handleChange} />
        <button type="button" onClick={handleUpload} className="px-3 py-1 rounded bg-gray-800 text-white" disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Formatos permitidos: MP4, WEBM, OGG. Tamaño máximo: 50MB.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && !error && <div className="text-green-700 text-sm">Video subido</div>}
    </div>
  );
}
