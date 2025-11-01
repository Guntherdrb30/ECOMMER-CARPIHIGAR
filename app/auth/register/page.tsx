"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAlly, setIsAlly] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryCedula, setDeliveryCedula] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMotoPlate, setDeliveryMotoPlate] = useState("");
  const [deliveryChassisSerial, setDeliveryChassisSerial] = useState("");
  const [deliveryIdImageUrl, setDeliveryIdImageUrl] = useState("");
  const [deliverySelfieUrl, setDeliverySelfieUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isDelivery) {
      if (
        !deliveryCedula.trim() ||
        !deliveryAddress.trim() ||
        !deliveryMotoPlate.trim() ||
        !deliveryChassisSerial.trim() ||
        !deliveryIdImageUrl ||
        !deliverySelfieUrl
      ) {
        setError(
          "Para registrarte como Delivery, completa todos los campos y sube las imágenes requeridas."
        );
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
        deliveryAddress,
        deliveryMotoPlate,
        deliveryChassisSerial,
        deliveryIdImageUrl,
        deliverySelfieUrl,
      }),
    });

    if (response.ok) {
      router.push("/auth/login");
    } else {
      const data = await response.json();
      setError(data.message || "Algo salió mal");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg space-y-4"
      >
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
            <input
              type="checkbox"
              checked={isAlly}
              onChange={(e) => setIsAlly(e.target.checked)}
            />
            <span className="text-gray-700">Soy arquitecto/diseñador/aliado</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDelivery}
              onChange={(e) => setIsDelivery(e.target.checked)}
            />
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
              <label className="block text-gray-700">Dirección</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700">Placa de la moto</label>
                <input
                  type="text"
                  value={deliveryMotoPlate}
                  onChange={(e) => setDeliveryMotoPlate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Serial de carrocería</label>
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
              <UploadField
                label="Foto de la cédula"
                value={deliveryIdImageUrl}
                setValue={setDeliveryIdImageUrl}
                setUploading={setUploading}
              />
              <UploadField
                label="Foto de tu rostro (selfie)"
                value={deliverySelfieUrl}
                setValue={setDeliverySelfieUrl}
                setUploading={setUploading}
              />
            </div>
            <p className="text-xs text-gray-600">
              Tu solicitud quedará en revisión. Te avisaremos cuando seas aprobado.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg"
          disabled={uploading}
        >
          {uploading ? "Subiendo archivos..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}

function UploadField({
  label,
  value,
  setValue,
  setUploading,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  setUploading: (b: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const handlePick = () => inputRef.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const base = `uploads/delivery/${yyyy}/${mm}/`;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const name = `${base}${Math.random().toString(36).slice(2)}.${ext}`;
      const res = await upload(name, file, { handleUploadUrl: '/api/blob/handle-upload' });
      if ((res as any)?.url) setValue((res as any).url);
    } catch (err) {
      console.error('Upload error', err);
      alert('No se pudo subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <div>
      <label className="block text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="preview"
            className="h-16 w-16 object-cover rounded border cursor-zoom-in"
            onClick={() => setOpen(true)}
          />
        ) : (
          <div className="h-16 w-16 rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-400">Sin imagen</div>
        )}
        <div className="flex flex-col gap-1">
          <button type="button" onClick={handlePick} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm disabled:opacity-50">{value ? 'Cambiar imagen' : 'Subir imagen'}</button>
          {value && (
            <button type="button" onClick={() => setValue('')} className="text-xs text-red-600 text-left">Quitar</button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {value && open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img src={value} alt="preview-full" className="max-h-[85vh] max-w-[90vw] rounded shadow-xl" />
            <button type="button" className="absolute -top-3 -right-3 bg-white rounded-full px-2 py-1 text-sm shadow" onClick={() => setOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
}
