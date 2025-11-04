'use client';

import { useActionState, useEffect, useState } from 'react';

async function start(formData: FormData) {
  const res = await fetch('/auth/root-recovery/start', { method: 'POST', body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo iniciar la recuperacion');
  return json;
}

async function complete(formData: FormData) {
  const res = await fetch('/auth/root-recovery/complete', { method: 'POST', body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'No se pudo completar la recuperacion');
  return json;
}

export default function RootRecoveryPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const onStart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setMessage('');
    const fd = new FormData(e.currentTarget);
    try {
      await start(fd);
      setMessage('Codigo enviado por WhatsApp. Revisa tu telefono.');
      setStep(2);
    } catch (err: any) {
      setError(String(err.message || err));
    }
  };

  const onComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setMessage('');
    const fd = new FormData(e.currentTarget);
    try {
      await complete(fd);
      setMessage('contrasena cambiada. Ya puedes iniciar sesion.');
    } catch (err: any) {
      setError(String(err.message || err));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Recuperar contrasena ROOT</h1>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        {message && <div className="mb-3 text-green-700 text-sm">{message}</div>}
        {step === 1 ? (
          <form onSubmit={onStart} className="space-y-3">
            <div>
              <label className="block text-gray-700 text-sm">Clave de recuperacion</label>
              <input name="secret" type="password" required minLength={6} className="w-full px-3 py-2 border rounded-lg" placeholder="Clave de recuperacion" />
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg">Enviar codigo por WhatsApp</button>
          </form>
        ) : (
          <form onSubmit={onComplete} className="space-y-3">
            <div>
              <label className="block text-gray-700 text-sm">Codigo recibido por WhatsApp</label>
              <input name="code" type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="123456" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm">Nueva contrasena</label>
              <input name="newPassword" type="password" required minLength={6} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm">Confirmar contrasena</label>
              <input name="confirm" type="password" required minLength={6} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg">Cambiar contrasena</button>
          </form>
        )}
      </div>
    </div>
  );
}

