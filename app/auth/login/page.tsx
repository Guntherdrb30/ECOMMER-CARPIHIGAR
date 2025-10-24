'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      const session = await getSession();
      const role = (session?.user as any)?.role as string | undefined;
      if (role === 'ADMIN') {
        router.replace('/dashboard/admin');
      } else if (role === 'ALIADO') {
        router.replace('/dashboard/aliado');
      } else {
        router.replace('/dashboard/cliente');
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
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
          <label className="block text-gray-700">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Login
        </button>
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
        >
          Continuar con Google
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:underline">
              Regístrate
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <Link href="/auth/forgot-username" className="font-medium text-blue-600 hover:underline">
              ¿Olvidaste tu usuario?
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
