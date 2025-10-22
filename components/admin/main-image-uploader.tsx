'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';

export default function MainImageUploader({ targetName = 'mainImage' }: { targetName?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const nameGuess = (file as any).name ? String((file as any).name).toLowerCase() : '';
      let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || '';
      if (!ext) ext = (file.type && file.type.includes('/')) ? file.type.split('/')[1] : 'bin';
      const pathname = `uploads/${year}/${month}/main.${ext}`;

      const res = await upload(pathname, file, {
        handleUploadUrl: '/api/blob/handle-upload',
        access: 'public',
      });
      setUrl(res.url);
    } catch (e: any) {
      console.error('[MainImageUploader] upload error', e);
      // stays silent in UI; can be enhanced to show error near the button
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {url && (
        <div className="w-32 h-32 border rounded overflow-hidden">
          <img src={url} alt="main" className="w-full h-full object-cover" />
          <input type="hidden" name={targetName} value={url} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} />
        <button type="button" onClick={() => onFile(fileRef.current?.files?.[0] || null)} disabled={busy} className="px-3 py-1 rounded border">
          {busy ? 'Subiendo...' : (url ? 'Reemplazar' : 'Subir')}
        </button>
      </div>
    </div>
  );
}


