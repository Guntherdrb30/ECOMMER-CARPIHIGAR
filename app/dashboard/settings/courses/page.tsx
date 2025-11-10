"use client";
import React, { useEffect, useState } from "react";

export default function CoursesSettingsPage() {
  const [topic, setTopic] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [hero, setHero] = useState<string>("");
  const [video, setVideo] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [list, setList] = useState<any[]>([]);

  const submit = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch('/api/courses/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, priceUSD: Number(price||0), saleStartAt: startAt || undefined, saleEndAt: endAt || undefined, heroImageUrl: hero || undefined, videoUrl: video || undefined })
      });
      const j = await res.json();
      if (j?.ok) setMsg('Curso generado: ' + j.course?.title);
      else setMsg(j?.error || 'No se pudo generar el curso');
    } catch (e: any) { setMsg(String(e?.message||e)); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/courses');
        const j = await r.json();
        if (j?.ok) setList(j.courses || []);
      } catch {}
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-2">Cursos: Generador con IA</h1>
      <p className="text-sm text-gray-600 mb-4">Crea cursos sobre herrajes, carpintería, revestimientos o diseño de cocinas. Los cursos se anuncian en Novedades con cuenta regresiva y certificados avalados por <strong>Trends172</strong> (17+ años, 1000+ proyectos).</p>
      <div className="space-y-2">
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Tema del curso (ej: Técnicas de instalación de bisagras oculta)" className="w-full border rounded px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Precio USD" className="w-32 border rounded px-3 py-2 text-sm" />
          <input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          <input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </div>
        <input value={hero} onChange={e=>setHero(e.target.value)} placeholder="URL imagen destacada (opcional)" className="w-full border rounded px-3 py-2 text-sm" />
        <input value={video} onChange={e=>setVideo(e.target.value)} placeholder="URL video (opcional)" className="w-full border rounded px-3 py-2 text-sm" />
        <button onClick={submit} disabled={busy} className="atlas-button rounded px-4 py-2 text-sm">{busy ? 'Creando...' : 'Crear curso con IA'}</button>
        {msg && <div className="text-sm mt-2">{msg}</div>}
    </div>
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Cursos existentes</h2>
        <div className="border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">Título</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Precio</th>
                <th className="text-left p-2">Creado</th>
                <th className="text-left p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.title}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">${Number(c.priceUSD as any).toFixed(2)}</td>
                  <td className="p-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">
                    <a href={`/dashboard/settings/courses/${c.id}`} className="underline">Editar</a>
                    <a href={`/cursos/${c.slug}`} className="ml-3 underline">Ver</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  </div>
  )
}
