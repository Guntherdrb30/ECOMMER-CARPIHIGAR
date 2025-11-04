"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function DeliveryImageUploader({
  label,
  value,
  onChange,
  required,
  onBusyChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  onBusyChange?: (busy: boolean) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
    try { onBusyChange?.(true); } catch {}
    setError(null);
    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const nameGuess = (file as any).name ? String((file as any).name).toLowerCase() : "";
      let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || "";
      if (!ext) ext = file.type?.split("/")[1] || "bin";
      const base = (nameGuess || "delivery").replace(/[^a-z0-9._-]+/g, "-");
      const pathname = `uploads/${year}/${month}/${base}.${ext}`;
      const res = await upload(pathname, file, {
        handleUploadUrl: "/api/blob/handle-upload",
        access: "public",
      });
      onChange(res.url);
    } catch (e: any) {
      setError(e?.message || "Error al subir la imagen");
    } finally {
      setBusy(false);
      try { onBusyChange?.(false); } catch {}
    }
  };

  const onInput = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type) && !/[.](png|jpe?g|webp|gif|svg)$/i.test((file as any).name || "")) {
      setError("Formato no permitido (PNG/JPG/WEBP/GIF/SVG)");
      return;
    }
    await doUpload(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-gray-700">{label}</label>
      {value ? (
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 rounded-md border bg-gray-50 overflow-hidden flex items-center justify-center">
            <img src={value} alt={label} className="w-full h-full object-cover" />
          </div>
          <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Abrir</a>
          <button type="button" className="text-sm text-red-600" onClick={() => onChange("")}>
            Quitar
          </button>
        </div>
      ) : null}
      <input
        type="url"
        placeholder="https://..."
        className="w-full px-3 py-2 border rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={onInput} className="max-w-full" />
        <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1 rounded border">Elegir archivo</button>
      </div>
      <p className="text-xs text-gray-500">{hint || 'Sube una imagen o pega un enlace (PNG/JPG/WEBP/SVG).'}</p>
      {busy && <p className="text-xs text-gray-500">Subiendo...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
