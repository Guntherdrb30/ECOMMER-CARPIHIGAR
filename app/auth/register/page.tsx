"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { normalizeVePhone } from "@/lib/phone";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAlly, setIsAlly] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryCedula, setDeliveryCedula] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMotoPlate, setDeliveryMotoPlate] = useState("");
  const [deliveryChassisSerial, setDeliveryChassisSerial] = useState("");
  const [deliveryIdImageUrl, setDeliveryIdImageUrl] = useState("");
  const [deliverySelfieUrl, setDeliverySelfieUrl] = useState("");
  const [agreeDelivery, setAgreeDelivery] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendOk, setResendOk] = useState<null | boolean>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isDelivery) {
      const normalized = normalizeVePhone(deliveryPhone);
      if (!normalized) {
        setError("Teléfono inválido. Usa 0412-1234567 o +58 412 1234567");
        return;
      }
      if (
        !deliveryCedula.trim() ||
        !deliveryPhone.trim() ||
        !deliveryAddress.trim() ||
        !deliveryMotoPlate.trim() ||
        !deliveryChassisSerial.trim() ||
        !deliveryIdImageUrl.trim() ||
        !deliverySelfieUrl.trim()
      ) {
        setError(
          "Para registrarte como Delivery, completa todos los campos y sube las imágenes requeridas."
        );
        return;
      }
      if (!agreeDelivery) {
        setError("Debes aceptar el Contrato de Servicio de Delivery.");
        return;
      }
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        isAlly,
        isDelivery,
        deliveryCedula,
        deliveryPhone: normalizeVePhone(deliveryPhone) || deliveryPhone,
        deliveryAddress,
        deliveryMotoPlate,
        deliveryChassisSerial,
        deliveryIdImageUrl,
        deliverySelfieUrl,
        agreeDelivery,
      }),
    });

    if (response.ok) {
      setDone(true);
    } else {
      const data = await response.json().catch(() => ({} as any));
      setError((data as any)?.message || "Algo salió mal");
    }
  };

  if (done) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-4 text-center">
          <h1 className="text-2xl font-bold">Revisa tu correo</h1>
          <p className="text-gray-700">
            Enviamos un enlace de verificación a <span className="font-semibold">{email}</span>. Debes verificar tu correo para activar tu cuenta.
          </p>
          <button
            type="button"
            onClick={async () => {
              setResendMsg("");
              setResendOk(null);
              try {
                const res = await fetch("/api/auth/resend-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                if (res.ok) {
                  setResendOk(true);
                  setResendMsg("Te reenviamos el enlace si el email existe y no estaba verificado.");
                } else {
                  setResendOk(false);
                  setResendMsg("No se pudo reenviar. Intenta más tarde.");
                }
              } catch {
                setResendOk(false);
                setResendMsg("Error reenviando verificación");
              }
            }}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          >
            Reenviar verificación
          </button>
          {resendMsg ? (
            <p className="text-xs" style={{ color: resendOk ? "#16a34a" : "#dc2626" }}>{resendMsg}</p>
          ) : null}
          <a href="/auth/login" className="inline-block mt-2 text-blue-600 underline">
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Registro</h1>
        {error && <p className="text-red-500">{error}</p>}

        <div>
          <label className="block text-gray-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isAlly} onChange={(e) => setIsAlly(e.target.checked)} />
            <span className="text-gray-700">Soy arquitecto/diseñador/aliado</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isDelivery} onChange={(e) => setIsDelivery(e.target.checked)} />
            <span className="text-gray-700">Quiero ser Delivery autorizado</span>
          </label>
        </div>

        {isDelivery && (
          <div className="space-y-3 border rounded p-3">
            <div>
              <label className="block text-gray-700">Cédula / ID</label>
              <input
                type="text"
                value={deliveryCedula}
                onChange={(e) => setDeliveryCedula(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Teléfono</label>
              <input
                type="tel"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0412-1234567"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Dirección</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700">Placa de moto</label>
                <input
                  type="text"
                  value={deliveryMotoPlate}
                  onChange={(e) => setDeliveryMotoPlate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Serial del chasis</label>
                <input
                  type="text"
                  value={deliveryChassisSerial}
                  onChange={(e) => setDeliveryChassisSerial(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700">URL foto cédula/ID</label>
                <input
                  type="url"
                  value={deliveryIdImageUrl}
                  onChange={(e) => setDeliveryIdImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">URL selfie</label>
                <input
                  type="url"
                  value={deliverySelfieUrl}
                  onChange={(e) => setDeliverySelfieUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                  required
                />
              </div>
            </div>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={agreeDelivery} onChange={(e) => setAgreeDelivery(e.target.checked)} />
              <span className="text-gray-700">Acepto el Contrato de Servicio de Delivery.</span>
            </label>
          </div>
        )}

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Registrarme
        </button>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full mt-2 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
        >
          Continuar con Google
        </button>
      </form>
    </div>
  );
}
