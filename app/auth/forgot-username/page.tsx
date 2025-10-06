'use client';

import { useState } from 'react';

export default function ForgotUsernamePage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    // Aquí va la lógica para enviar el correo con el nombre de usuario
    console.log('Solicitud de usuario para:', email);
    setMessage('Si el correo está registrado, recibirás tu nombre de usuario.');
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Recuperar Usuario</h1>
        {message && <p className="text-green-500 mb-4">{message}</p>}
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
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Enviar nombre de usuario
        </button>
      </form>
    </div>
  );
}
