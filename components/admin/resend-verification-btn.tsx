"use client";

import { useState } from "react";

export default function ResendVerificationBtn({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [ok, setOk] = useState<boolean | null>(null);

  async function onClick() {
    setPending(true);
    setMsg("");
    setOk(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (res.ok) {
        if (json?.already) {
          setOk(true);
          setMsg("El correo ya estaba verificado.");
        } else if (json?.emailed === true) {
          setOk(true);
          setMsg("Se envio verificacion al correo.");
        } else {
          setOk(false);
          setMsg("No se envio el correo (deshabilitado o sin SMTP).");
        }
      } else {
        setOk(false);
        setMsg("No se pudo reenviar. Verifica SMTP/EMAIL_ENABLED.");
      }
    } catch {
      setOk(false);
      setMsg("Error reenviando verificacion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="px-3 py-1 border rounded disabled:opacity-60"
        title="Reenviar verificacion"
      >
        {pending ? "Enviando..." : "Reenviar verificacion"}
      </button>
      {msg ? (
        <span
          className="text-xs"
          style={{ color: ok ? "#16a34a" : "#dc2626" }}
        >
          {msg}
        </span>
      ) : null}
    </div>
  );
}

