"use client";
import React, { useEffect, useState } from "react";

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/courses/${id}`);
        const j = await r.json();
        if (j?.ok) setData(j.course);
      } catch {}
    })();
  }, [id]);

  const save = async () => {
    if (!data) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`/api/courses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: data.title,
        summary: data.summary,
        priceUSD: Number(data.priceUSD||0),
        status: data.status,
        heroImageUrl: data.heroImageUrl,
        videoUrl: data.videoUrl,
        saleStartAt: data.saleStartAt,
        saleEndAt: data.saleEndAt,
      }) });
      const j = await r.json();
      setMsg(j?.ok ? 'Guardado' : (j?.error || 'No se pudo guardar'));
    } catch (e: any) { setMsg(String(e?.message||e)); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="p-4">Cargando...</div>;
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Editar curso</h1>
      <div className="space-y-2">
        <input value={data.title||''} onChange={e=>setData({ ...data, title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="Título" />
        <textarea value={data.summary||''} onChange={e=>setData({ ...data, summary: e.target.value })} className="w-full border rounded px-3 py-2 text-sm min-h-[120px]" placeholder="Resumen" />
        <div className="flex gap-2">
          <input value={data.priceUSD||0} onChange={e=>setData({ ...data, priceUSD: e.target.value })} className="w-32 border rounded px-3 py-2 text-sm" placeholder="Precio USD" />
          <select value={data.status||'PUBLISHED'} onChange={e=>setData({ ...data, status: e.target.value })} className="border rounded px-3 py-2 text-sm">
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <input value={data.heroImageUrl||''} onChange={e=>setData({ ...data, heroImageUrl: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="URL imagen" />
        <input value={data.videoUrl||''} onChange={e=>setData({ ...data, videoUrl: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" placeholder="URL video" />
        <div className="flex gap-2">
          <input type="datetime-local" value={data.saleStartAt ? String(data.saleStartAt).slice(0,16) : ''} onChange={e=>setData({ ...data, saleStartAt: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          <input type="datetime-local" value={data.saleEndAt ? String(data.saleEndAt).slice(0,16) : ''} onChange={e=>setData({ ...data, saleEndAt: e.target.value })} className="border rounded px-3 py-2 text-sm" />
        </div>
        <button className="atlas-button rounded px-4 py-2" onClick={save} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</button>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>
    </div>
  )
}

