'use client';

import { useState } from 'react';
import { updateUserProfile, changePassword } from '@/server/actions/user';
import { useSession } from 'next-auth/react';
import { Toaster, toast } from 'sonner';

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [phone, setPhone] = useState((session?.user as any)?.phone || '');

  const handleProfileUpdate = async (formData: FormData) => {
    const result = await updateUserProfile(formData);
    if (result.success) {
      toast.success(result.message);
      // Update the session to reflect the new name
      await update({ name: formData.get('name') });
    } else {
      toast.error(result.message);
    }
  };

  const handlePasswordChange = async (formData: FormData) => {
    const result = await changePassword(formData);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    // It's good practice to clear password fields after submission
    const form = document.getElementById('passwordForm') as HTMLFormElement;
    form.reset();
  };

  if (!session) {
    return <div>Cargando...</div>; // Or a spinner component
  }

  return (
    <div>
      <Toaster richColors />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
      
      {/* Profile Information Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Información Personal</h2>
        <form action={handleProfileUpdate}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input 
                type="tel" 
                name="phone" 
                id="phone" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                defaultValue={session.user.email || ''} 
                readOnly 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="mt-6 text-right">
            <button type="submit" className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">Guardar Cambios</button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Cambiar Contraseña</h2>
        <form id="passwordForm" action={handlePasswordChange}>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
              <input type="password" name="currentPassword" id="currentPassword" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Contraseña Nueva</label>
              <input type="password" name="newPassword" id="newPassword" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contraseña Nueva</label>
              <input type="password" name="confirmPassword" id="confirmPassword" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="mt-6 text-right">
            <button type="submit" className="bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">Cambiar Contraseña</button>
          </div>
        </form>
      </div>
    </div>
  );
}
