"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";

type Props = {
  src: string;
  alt?: string;
  thumbClassName?: string;
  fullClassName?: string;
};

export default function ImageLightbox({
  src,
  alt = "Imagen",
  thumbClassName = "w-40 h-28 object-cover rounded border shadow-sm",
  fullClassName = "max-w-[90vw] max-h-[90vh] object-contain rounded shadow-lg",
}: Props) {
  const [open, setOpen] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [fullError, setFullError] = useState(false);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onKey]);

  const fallback = "/logo-default.svg";

  return (
    <>
      <button type="button" className="inline-block" onClick={() => setOpen(true)}>
        <img
          src={thumbError ? fallback : src}
          alt={alt}
          className={thumbClassName}
          onError={() => setThumbError(true)}
        />
      </button>
      {open && (
        <div className="fixed inset-0 z-[95]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative">
              <img
                src={fullError ? fallback : src}
                alt={alt}
                className={fullClassName}
                onError={() => setFullError(true)}
              />
              <button
                type="button"
                aria-label="Cerrar"
                className="absolute -top-3 -right-3 bg-white rounded-full shadow p-1 px-2 text-sm"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
