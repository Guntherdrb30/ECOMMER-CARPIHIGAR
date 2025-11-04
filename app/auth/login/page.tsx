"use client";

import { useMemo, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendOk, setResendOk] = useState<null | boolean>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    try {
      return searchParams?.get("callbackUrl") || "";
    } catch {
      return "";
    }
  }, [searchParams]);
  const verifiedMsg = useMemo(() => {
    try {
      return (searchParams?.get("message") || "").toLowerCase() === "verified";
    } catch {
      return false;
    }
  }, [searchParams]);
  const verifyRequired = useMemo(() => {
    try {
      return (searchParams?.get("message") || "").toLowerCase() === "verify-required";
    } catch {
      return false;
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      const next = (callbackUrl || "").trim();
      const session = await getSession();
      const role = (session?.user as any)?.role as string | undefined;
      if (role === "ADMIN") {
        router.replace("/dashboard/admin");
        return;
      }
      if (next) {
        router.replace(next);
        return;
      }
      if (role === "DELIVERY") {
        router.replace("/dashboard/delivery");
      } else if (role === "ALIADO") {
        router.replace("/dashboard/aliado");
      } else {
        router.replace("/dashboard/cliente");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <div className="flex flex-col items-center mb-4"><img src="/logo-default.svg" alt="Carpihogar" className="h-10 mb-2" /><h1 className="text-2xl font-bold">Iniciar sesion</h1></div>
        {verifiedMsg ? (
          <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 px-3 py-2 text-sm">
            Tu correo fue verificado. Ya puedes Iniciar sesion.
          </div>
        ) : null}
        {verifyRequired ? (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            Debes verificar tu correo para comprar o usar el panel. Si no recibiste el email, reenviarlo abajo.
          </div>
        ) : null}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Iniciar sesion
        </button>
        {resendMsg ? (
          <p className="text-xs mt-2" style={{ color: resendOk ? "#16a34a" : "#dc2626" }}>{resendMsg}</p>
        ) : null}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/auth/after-Iniciar sesion" })}
          className="w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
        >
          Continuar con Google
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Â?No tienes cuenta?{" "}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:underline">
              Registrate
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:underline">
              Â?Olvidaste tu Contrasena?
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <Link href="/auth/forgot-username" className="font-medium text-blue-600 hover:underline">
              Â?Olvidaste tu usuario?
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-3">Â?No recibiste el correo de verificacion?</p>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/auth/resend-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const ok = res.ok;
                if (ok) {
                  setResendOk(true);
                  setResendMsg("Te enviamos el enlace si el email existe y no estaba verificado.");
                } else {
                  setResendOk(false);
                  setResendMsg("No se pudo reenviar. Intenta mÃ!s tarde.");
                }
              } catch {
                setResendOk(false);
                setResendMsg("Error reenviando verificacion");
              }
            }}
            className="mt-2 w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          >
            Reenviar verificacion
          </button>
        </div>
      </form>
    </div>
  );
}




