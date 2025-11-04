'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setPending(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(json?.message || 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.');
      } else {
        setError('No se pudo procesar la solicitud. Intenta más tarde.');
      }
    } catch {
      setError('Ocurrió un error al solicitar el restablecimiento de la contraseña.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Recuperar Contraseña</h1>
        {message && <p className="text-green-500 mb-4">{message}</p>}
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
        <button disabled={pending} type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg disabled:opacity-60">
          {pending ? 'Enviando…' : 'Enviar enlace de recuperación'}
        </button>
      </form>
    </div>
  );
}
