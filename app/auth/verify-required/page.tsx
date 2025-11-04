"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function VerifyRequiredPage() {
  const { data: session, status } = useSession();
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState<null | boolean>(null);

  const email = useMemo(() => {
    return (session?.user as any)?.email || "";
  }, [session]);

  useEffect(() => {
    setMsg("");
    setOk(null);
  }, [email]);

  const resend = async () => {
    try {
      if (!email) {
        setOk(false);
        setMsg("No se encontro un email en tu sesion.");
        return;
      }
      setSending(true);
      setMsg("");
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setOk(true);
        setMsg("Si el correo existe y no estaba verificado, te enviamos el enlace.");
      } else {
        setOk(false);
        setMsg("No se pudo reenviar. Intenta mas tarde.");
      }
    } catch {
      setOk(false);
      setMsg("Error reenviando verificacion.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold mb-2">Verifica tu correo</h1>
        <p className="text-sm text-gray-600 mb-4">
          Para comprar o usar el panel, primero debes verificar tu correo.
        </p>

        <div className="mb-4 text-sm">
          <div className="text-gray-700">Correo de tu sesion:</div>
          <div className="font-medium break-all">{status === "loading" ? "Cargandoa€¦" : (email || "(sin correo)")}</div>
        </div>

        {msg ? (
          <div
            className="mb-4 rounded px-3 py-2 text-sm"
            style={{
              backgroundColor: ok ? "#ecfdf5" : "#fef2f2",
              color: ok ? "#065f46" : "#991b1b",
              border: `1px solid ${ok ? "#a7f3d0" : "#fecaca"}`,
            }}
          >
            {msg}
          </div>
        ) : null}

        <button
          onClick={resend}
          disabled={sending || !email}
          className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {sending ? "Enviandoa€¦" : "Reenviar verificacion"}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <Link href="/" className="hover:underline">Volver al inicio</Link>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="hover:underline">
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}

