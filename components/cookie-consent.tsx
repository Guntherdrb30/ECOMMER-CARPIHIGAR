"use client";

import { useEffect, useMemo, useState } from "react";

type ConsentValue = "all" | "necessary" | null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export default function CookieConsent({ initialConsent }: { initialConsent: ConsentValue }) {
  const [visible, setVisible] = useState(false);
  const consent = useMemo<ConsentValue>(() => {
    if (typeof window === "undefined") return initialConsent ?? null;
    return (readCookie("cookie_consent") as ConsentValue) ?? initialConsent ?? null;
  }, [initialConsent]);

  useEffect(() => {
    setVisible(!consent);
  }, [consent]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-5xl px-4 pb-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700 sm:mr-4">
            Usamos cookies necesarias para el funcionamiento del sitio y opcionales para analizar el uso y mejorar tu experiencia. Puedes aceptar solo las necesarias o todas.
          </p>
          <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
            <button
              type="button"
              onClick={() => {
                setCookie("cookie_consent", "necessary", 60 * 60 * 24 * 180);
                setVisible(false);
              }}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Solo necesarias
            </button>
            <button
              type="button"
              onClick={() => {
                setCookie("cookie_consent", "all", 60 * 60 * 24 * 180);
                setVisible(false);
              }}
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

