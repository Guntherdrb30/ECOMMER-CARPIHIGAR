"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function DeliveryImageUploader({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
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
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 mb-2">
          <img src={value} alt={label} className="w-16 h-16 rounded border object-cover" />
          <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Abrir</a>
          <button type="button" className="text-sm text-red-600" onClick={() => onChange("")}>
            Quitar
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={onInput} />
        <input
          type="url"
          placeholder="https://..."
          className="flex-1 px-3 py-2 border rounded-lg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Puedes subir una imagen o pegar un enlace (PNG/JPG/WEBP/SVG).</p>
      {busy && <p className="text-xs text-gray-500">Subiendo...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

