'use client';

import { useState, useRef } from 'react';

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
    // Client-side validation
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
      // Direct upload via Vercel Blob
      const urlRes = await fetch('/api/blob/upload-url', { method: 'POST' });
      const { url } = await urlRes.json();
      if (!urlRes.ok || !url) {
        setError('No se pudo crear URL de carga');
        return;
      }
      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      const uploaded = await put.json().catch(() => ({} as any));
      if (!put.ok) {
        setError((uploaded as any)?.error || 'Error al subir archivo');
        return;
      }
      const finalUrl = (uploaded as any)?.url || url.split('?')[0];
      setPreview(finalUrl);
      const input = document.querySelector<HTMLInputElement>(`input[name="${targetInputName}"]`);
      if (input) input.value = finalUrl;
      setOk(true);
      // Nota: detección de color ya no aplica en direct upload sin sharp; se puede calcular en servidor si se requiere.
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
      <p className="text-xs text-gray-500">Formatos permitidos: PNG, JPG, WEBP, SVG. TamaÃ±o mÃ¡ximo: 2MB.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && !error && <div className="text-green-700 text-sm">Imagen subida</div>}
    </div>
  );
}

