'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function LogoUploader({ targetInputName, defaultUrl }: { targetInputName: string; defaultUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(defaultUrl);
  const [detectedColor, setDetectedColor] = useState<string | undefined>(undefined);
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [ok, setOk] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo'); setOk(false); return; }
    // Validación de formato
    const allowed = ['image/png','image/jpeg','image/webp','image/svg+xml'];
    const name = (file as any).name ? String((file as any).name).toLowerCase() : '';
    const okExt = ['.png','.jpg','.jpeg','.webp','.svg'].some((ext) => name.endsWith(ext));
    if (!(allowed.includes(file.type) || okExt)) {
      setError('Formato no permitido. Usa PNG, JPG, WEBP o SVG.');
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
      const nameGuess = name;
      let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || '';
      if (!ext) ext = (file.type && file.type.includes('/')) ? file.type.split('/')[1] : 'bin';
      const base = (nameGuess || 'logo').replace(/[^a-z0-9._-]+/g, '-');
      const pathname = `uploads/${year}/${month}/${base}.${ext}`;

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
          setError(e?.message || 'Error al subir la imagen');
          setOk(false);
        }
      } catch (e2: any) {
        setError(e2?.message || 'Error al subir la imagen');
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
        <img src={preview} alt="Logo" className="h-12" />
      )}
      {(detectedColor || secondaryColor) && (
        <div className="flex items-center gap-4 text-sm text-gray-700">
          {detectedColor && (
            <div className="flex items-center gap-2">
              <span>Primario:</span>
              <span className="inline-block w-5 h-5 rounded border" style={{ backgroundColor: detectedColor }} />
              <code>{detectedColor}</code>
            </div>
          )}
          {secondaryColor && (
            <div className="flex items-center gap-2">
              <span>Secundario:</span>
              <span className="inline-block w-5 h-5 rounded border" style={{ backgroundColor: secondaryColor }} />
              <code>{secondaryColor}</code>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleChange} />
        <button type="button" onClick={handleUpload} className="px-3 py-1 rounded bg-gray-800 text-white" disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Formatos permitidos: PNG, JPG, WEBP, SVG. Tamaño máximo: 2MB.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && !error && <div className="text-green-700 text-sm">Imagen subida</div>}
    </div>
  );
}
