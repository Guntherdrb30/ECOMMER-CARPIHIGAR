"use client";

import React, { useState } from "react";
import DeliveryImageUploader from "@/components/delivery/image-uploader";
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
  const [deliveryVehicleType, setDeliveryVehicleType] = useState("MOTO");
  const [deliveryVehicleBrand, setDeliveryVehicleBrand] = useState("");
  const [deliveryVehicleModel, setDeliveryVehicleModel] = useState("");
  const [deliveryMotoPlate, setDeliveryMotoPlate] = useState("");
  const [deliveryChassisSerial, setDeliveryChassisSerial] = useState("");
  const [plateError, setPlateError] = useState<string>("");
  const [vinError, setVinError] = useState<string>("");
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
        setError("Telefono invalido. Usa 0412-1234567 o +58 412 1234567");
        return;
      }
      const normalizePlate = (v: string) => v.replace(/\s+/g, '').toUpperCase();
      const plate = normalizePlate(deliveryMotoPlate);
      const vin = deliveryChassisSerial.replace(/\s+/g, '').toUpperCase();
      const isMoto = deliveryVehicleType === 'MOTO';
      const plateOk = /^[A-Z0-9-]{5,8}$/.test(plate);
      const vinOk = isMoto ? vin.length >= 6 : /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
      setPlateError(plateOk ? "" : "Placa invalida (5-8 caracteres, letras/numeros)");
      setVinError(vinOk ? "" : (isMoto ? 'Serial de chasis invalido' : 'VIN invalido (17 caracteres, sin I/O/Q)'));
      if (
        !deliveryCedula.trim() ||
        !deliveryPhone.trim() ||
        !deliveryAddress.trim() ||
        !deliveryVehicleBrand.trim() ||
        !deliveryVehicleModel.trim() ||
        !plateOk ||
        !vinOk ||
        !deliveryIdImageUrl.trim() ||
        !deliverySelfieUrl.trim()
      ) {
        const msgs: string[] = [];
        if (!plateOk) msgs.push('Placa invalida (5-8 caracteres, letras/numeros)');
        if (!vinOk) msgs.push(isMoto ? 'Serial de chasis invalido' : 'VIN invalido (17 caracteres, sin I/O/Q)');
        setError(msgs.join(' | ') || "Para registrarte como Delivery, completa todos los campos y sube las imagenes requeridas.");
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
        deliveryVehicleType,
        deliveryVehicleBrand,
        deliveryVehicleModel,
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
      setError((data as any)?.message || "Algo salio mal");
    }
  };

  if (done) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-4 text-center">
          <h1 className="text-2xl font-bold">Revisa tu correo</h1>
          <p className="text-gray-700">
            Enviamos un enlace de verificacion a <span className="font-semibold">{email}</span>. Debes verificar tu correo para activar tu cuenta.
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
                  setResendMsg("Te reenvioos el enlace si el email existe y no estaba verificado.");
                } else {
                  setResendOk(false);
                  setResendMsg("No se pudo reenvio. Intenta mas tarde.");
                }
              } catch {
                setResendOk(false);
                setResendMsg("Error reenviodo verificacion");
              }
            }}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
          >
            reenvio verificacion
          </button>
          {resendMsg ? (
            <p className="text-xs" style={{ color: resendOk ? "#16a34a" : "#dc2626" }}>{resendMsg}</p>
          ) : null}
          <a href="/auth/login" className="inline-block mt-2 text-blue-600 underline">
            Ir a iniciar sesion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-4">
        <div className="flex flex-col items-center mb-1">
          <img src="/logo-default.svg" alt="Carpihogar" className="h-10 mb-2" />
          <h1 className="text-2xl font-bold">Registro</h1>
        </div>
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
          <label className="block text-gray-700">contrasena</label>
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
            <span className="text-gray-700">Soy arquitecto/disenador/aliado</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isDelivery} onChange={(e) => setIsDelivery(e.target.checked)} />
            <span className="text-gray-700">Quiero ser Delivery autorizado</span>
          </label>
        </div>

        {isDelivery && (
          <div className="space-y-4 border rounded p-4">
            <h2 className="text-lg font-semibold">Solicitud de Delivery</h2>
            <div>
              <label className="block text-gray-700">Cedula / ID</label>
              <input
                type="text"
                value={deliveryCedula}
                onChange={(e) => setDeliveryCedula(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Telefono</label>
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
              <label className="block text-gray-700">Direccion</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700">Tipo de vehiculo</label>
                <select
                  value={deliveryVehicleType}
                  onChange={(e) => setDeliveryVehicleType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="MOTO">Moto</option>
                  <option value="CARRO">Carro</option>
                  <option value="CAMIONETA">Camioneta</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700">Placa del vehiculo</label>
                <input
                  type="text"
                  value={deliveryMotoPlate}
                  onChange={(e) => { setPlateError(""); setDeliveryMotoPlate(e.target.value.replace(/\s+/g,'').toUpperCase()); }}
                  className={`w-full px-3 py-2 rounded-lg border ${plateError ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  placeholder={deliveryVehicleType === 'MOTO' ? 'Ej: AB1C2D' : 'Ej: AB123CD'}
                  title="5-8 caracteres, letras y numeros"
                />
                <p className={`text-xs mt-1 ${plateError ? 'text-red-600' : 'text-gray-500'}`}>{plateError || (deliveryVehicleType === 'MOTO' ? 'Ejemplos: AB1C2D, A1B2C3' : 'Ejemplos: AB123CD, ABC12D')}</p>
              </div>
              <div>
                <label className="block text-gray-700">Serial del chasis / VIN</label>
                <input
                  type="text"
                  value={deliveryChassisSerial}
                  onChange={(e) => { setVinError(""); setDeliveryChassisSerial(e.target.value.toUpperCase()); }}
                  className={`w-full px-3 py-2 rounded-lg border ${vinError ? 'border-red-500' : 'border-gray-300'}`}
                  required
                  placeholder={deliveryVehicleType === 'MOTO' ? 'Serial de chasis' : 'VIN (17 caracteres)'}
                  title={deliveryVehicleType === 'MOTO' ? 'Ingrese el serial de chasis' : 'VIN de 17 caracteres (sin I, O, Q)'}
                />
                <p className={`text-xs mt-1 ${vinError ? 'text-red-600' : 'text-gray-500'}`}>{vinError || (deliveryVehicleType === 'MOTO' ? 'Ingresa el serial del chasis (moto)' : 'Ingresa el VIN de 17 caracteres (carro/camioneta)')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700">Marca</label>
                <input
                  type="text"
                  value={deliveryVehicleBrand}
                  onChange={(e) => setDeliveryVehicleBrand(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={
                    deliveryVehicleType === 'MOTO' ? 'Ej: Honda, Yamaha, Suzuki' :
                    deliveryVehicleType === 'CARRO' ? 'Ej: Ford, Toyota, Chevrolet' :
                    'Ej: Toyota, Chevrolet, Ford'
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Modelo</label>
                <input
                  type="text"
                  value={deliveryVehicleModel}
                  onChange={(e) => setDeliveryVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={
                    deliveryVehicleType === 'MOTO' ? 'Ej: CG150, AX100, DT125' :
                    deliveryVehicleType === 'CARRO' ? 'Ej: Fiesta, Corolla, Aveo' :
                    'Ej: Hilux, Silverado, Explorer'
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DeliveryImageUploader
                label="Foto cedula/ID"
                value={deliveryIdImageUrl}
                onChange={setDeliveryIdImageUrl}
                required
                hint="Foto frontal legible, sin reflejos. Formatos: PNG/JPG/WEBP."
              />
              <DeliveryImageUploader
                label="Selfie"
                value={deliverySelfieUrl}
                onChange={setDeliverySelfieUrl}
                required
                hint="Selfie sosteniendo tu cedula/ID, rostro visible."
              />
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
          onClick={() => signIn("google", { callbackUrl: "/auth/after-login" })}
          className="w-full mt-2 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
        >
          Continuar con Google
        </button>
      </form>
    </div>
  );
}


