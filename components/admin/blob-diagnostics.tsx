'use client';

import { useEffect, useState } from 'react';

type Health = { ok: boolean; urlCreated?: boolean; hasToken?: boolean; error?: string } | null;

export default function BlobDiagnostics() {
  const [health, setHealth] = useState<Health>(null);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setLoading(true);
      try {
        const r = await fetch('/api/blob/upload-url', { method: 'GET' });
        const data = await r.json();
        if (!mounted) return;
        setHealth({ ok: r.ok && !!data.ok, urlCreated: !!data.urlCreated, hasToken: data.hasToken, error: data.error });
      } catch (e: any) {
        if (!mounted) return;
        setHealth({ ok: false, error: e?.message || 'Error de conexión' });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, []);

  async function createUrl() {
    setCreating(true);
    setPostUrl(null);
    try {
      const r = await fetch('/api/blob/upload-url', { method: 'POST' });
      const data = await r.json();
      if (!r.ok || !data?.url) {
        throw new Error(data?.error || 'No se pudo crear URL');
      }
      setPostUrl(String(data.url));
    } catch (e) {
      setPostUrl('ERROR: ' + ((e as any)?.message || 'desconocido'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Estado de almacenamiento (Vercel Blob)</h3>
        <button onClick={() => location.reload()} className="text-sm px-2 py-1 border rounded">Recargar</button>
      </div>
      <div className="text-sm">
        {loading && <div>Verificando…</div>}
        {!loading && health && (
          <div>
            <div className="mb-1">
              Estado: {health.ok ? (
                <span className="text-green-700">OK</span>
              ) : (
                <span className="text-red-700">ERROR</span>
              )}
            </div>
            {typeof health.urlCreated !== 'undefined' && (
              <div className="mb-1">URL firma (GET): {health.urlCreated ? 'creada' : 'no creada'}</div>
            )}
            {typeof health.hasToken !== 'undefined' && (
              <div className="mb-1">Token presente: {health.hasToken ? 'sí' : 'no'}</div>
            )}
            {health.error && <div className="text-red-700">{health.error}</div>}
          </div>
        )}
      </div>
      <div className="mt-3">
        <button onClick={createUrl} disabled={creating} className="px-3 py-1 border rounded">
          {creating ? 'Creando URL…' : 'Probar crear URL firmada'}
        </button>
        {postUrl && (
          <div className="mt-2 break-all text-xs">
            Resultado: {postUrl}
          </div>
        )}
      </div>
      <div className="mt-3 text-xs text-gray-600">
        Consejo: si falla, verifica en Vercel → Project → Settings → Environment Variables que BLOB_READ_WRITE_TOKEN esté en Production y redeploya.
      </div>
    </div>
  );
}

