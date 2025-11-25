'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

type MainImageUploaderProps = {
  targetName?: string;
  // Callback opcional para decidir si se reemplazan las imágenes anteriores.
  onBeforeFirstUpload?: () => 'keep' | 'replace' | null;
};

export default function MainImageUploader({
  targetName = 'mainImage',
  onBeforeFirstUpload,
}: MainImageUploaderProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;

    try {
      onBeforeFirstUpload?.();
    } catch {
      // Ignoramos errores de confirmación.
    }

    setBusy(true);
    setError(null);
    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const nameGuess = (file as any).name ? String((file as any).name).toLowerCase() : '';
      let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || '';
      if (!ext) ext = (file.type && file.type.includes('/')) ? file.type.split('/')[1] : 'bin';
      const pathname = `uploads/${year}/${month}/main.${ext}`;

      const tryServerFallback = async () => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'image');
        const resp = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await resp.json().catch(() => ({} as any));
        if (!resp.ok || !data?.url) throw new Error(data?.error || 'Upload fallido');
        return data.url as string;
      };

      try {
        const res = await upload(pathname, file, {
          handleUploadUrl: '/api/blob/handle-upload',
          access: 'public',
        });
        setUrl(res.url);
      } catch (err: any) {
        try {
          const probe = await fetch('/api/blob/handle-upload', { method: 'GET' });
          const info = await probe.json().catch(() => ({} as any));
          if (
            !probe.ok ||
            info?.hasToken === false ||
            String(err?.message || '').toLowerCase().includes('client token')
          ) {
            const fallbackUrl = await tryServerFallback();
            setUrl(fallbackUrl);
          } else {
            throw err;
          }
        } catch (e: any) {
          console.error('[MainImageUploader] upload error', e);
          setError(e?.message || 'No se pudo subir la imagen principal');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {url && (
        <div className="w-32 h-32 border rounded overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="main" className="w-full h-full object-cover" />
          <input type="hidden" name={targetName} value={url} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? 'Subiendo...' : 'Subir archivo'}
        </button>
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}

