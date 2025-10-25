import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateUserProfile, changePassword } from "@/server/actions/user";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return <div className="p-4">Debes iniciar sesion para ver tu perfil.</div>;
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  const name = session.user.name || "";
  const phone = (user?.phone as any) || "";

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Informacion Personal</h2>
        <form action={updateUserProfile}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input
                type="text"
                name="name"
                id="name"
                defaultValue={name}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefono</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                defaultValue={phone}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electronico</label>
              <input
                type="email"
                name="email"
                id="email"
                defaultValue={session.user.email || ""}
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

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Cambiar Contrasena</h2>
        <form action={changePassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Contrasena Actual</label>
              <input type="password" name="currentPassword" id="currentPassword" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Contrasena Nueva</label>
              <input type="password" name="newPassword" id="newPassword" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Contrasena Nueva</label>
              <input type="password" name="confirmPassword" id="confirmPassword" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="mt-6 text-right">
            <button type="submit" className="bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">Cambiar Contrasena</button>
          </div>
        </form>
      </div>
    </div>
  );
}
