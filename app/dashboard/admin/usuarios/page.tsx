
import { getUsers, approveAlly, createAdminUser, updateUser, deleteUserByForm, updateUserPasswordByForm } from "@/server/actions/users";
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PendingButton from '@/components/pending-button';

export default async function AdminUsersPage() {
  const users = await getUsers();
  const session = await getServerSession(authOptions);
  const email = String((session?.user as any)?.email || '').toLowerCase();
  const role = String((session?.user as any)?.role || '');
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const isRoot = role === 'ADMIN' && email === rootEmail;

  return (
    <div className="container mx-auto p-4">
      <ShowToastFromSearch />
      <h1 className="text-2xl font-bold mb-4">Gestionar Usuarios</h1>
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-bold mb-2">Crear usuario Administrador</h2>
        <form action={async (formData) => {
          'use server';
          const name = String(formData.get('name') || '');
          const email = String(formData.get('email') || '');
          const password = String(formData.get('password') || '');
          await createAdminUser(name, email, password);
        }} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input name="name" placeholder="Nombre" className="border rounded px-2 py-1" required />
          <input type="email" name="email" placeholder="Email" className="border rounded px-2 py-1" required />
          <input type="password" name="password" placeholder="Contraseña" className="border rounded px-2 py-1" required />
          <PendingButton className="bg-blue-600 text-white px-3 py-1 rounded" pendingText="Creando…">Crear Admin</PendingButton>
        </form>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-bold mb-2">Crear usuario Vendedor</h2>
        <form action={async (formData) => {
          'use server';
          const name = String(formData.get('seller_name') || '');
          const email = String(formData.get('seller_email') || '');
          const password = String(formData.get('seller_password') || '');
          const commission = formData.get('seller_commission') ? parseFloat(String(formData.get('seller_commission'))) : undefined;
          const { createSellerUser } = await import('@/server/actions/users');
          await createSellerUser(name, email, password, commission);
        }} className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input name="seller_name" placeholder="Nombre" className="border rounded px-2 py-1" required />
          <input type="email" name="seller_email" placeholder="Email" className="border rounded px-2 py-1" required />
          <input type="password" name="seller_password" placeholder="Contraseña" className="border rounded px-2 py-1" required />
          <input type="number" step="0.01" min="0" max="100" name="seller_commission" placeholder="% Comisión (opcional)" className="border rounded px-2 py-1" />
          <PendingButton className="bg-green-600 text-white px-3 py-1 rounded" pendingText="Creando…">Crear Vendedor</PendingButton>
        </form>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h2 className="text-lg font-bold mb-2">Todos los Usuarios</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Estatus Aliado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border px-4 py-2">{user.name}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">{user.role}</td>
                  <td className="border px-4 py-2">{user.alliedStatus}</td>
                  <td className="border px-4 py-2 space-y-2">
                    {user.alliedStatus === "PENDING" && (
                      <form action={async () => { 
                          'use server';
                          await approveAlly(user.id);
                      }}>
                        <PendingButton className="bg-green-500 text-white px-2 py-1 rounded" pendingText="Aprobando…">Aprobar Aliado</PendingButton>
                      </form>
                    )}
                    <form action={updateUser} className="flex flex-wrap gap-2 items-center">
                      <input type="hidden" name="id" value={user.id} />
                      <input name="name" defaultValue={user.name || ''} className="border rounded px-2 py-1 w-40" placeholder="Nombre" />
                      <select name="role" defaultValue={user.role} className="border rounded px-2 py-1">
                        <option value="CLIENTE">CLIENTE</option>
                        <option value="ALIADO">ALIADO</option>
                        <option value="VENDEDOR">VENDEDOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      {user.role === 'VENDEDOR' && (
                        <input name="commissionPercent" type="number" step="0.01" min="0" max="100" defaultValue={(user as any).commissionPercent?.toString?.()} placeholder="% Comisión" className="border rounded px-2 py-1 w-32" />
                      )}
                      <PendingButton className="px-3 py-1 bg-gray-800 text-white rounded" pendingText="Guardando…">Guardar</PendingButton>
                    </form>
                    <form action={deleteUserByForm} className="flex flex-wrap gap-2 items-center">
                      <input type="hidden" name="id" value={user.id} />
                      <input name="secret" type="password" placeholder="Clave secreta" className="border rounded px-2 py-1 w-40" required />
                      <PendingButton className="px-3 py-1 bg-red-600 text-white rounded" pendingText="Eliminando…" title="Eliminar usuario">Eliminar</PendingButton>
                    </form>
                    {isRoot && (
                      <form action={updateUserPasswordByForm} className="flex flex-wrap gap-2 items-center">
                        <input type="hidden" name="id" value={user.id} />
                        <input name="newPassword" type="password" placeholder="Nueva clave (min 8 + número)" className="border rounded px-2 py-1 w-56" required minLength={8} pattern="(?=.*\d).{8,}" />
                        <input name="confirm" type="password" placeholder="Confirmar clave" className="border rounded px-2 py-1 w-56" required minLength={8} />
                        <PendingButton className="px-3 py-1 bg-blue-600 text-white rounded" pendingText="Actualizando…" title="Cambiar clave">Cambiar clave</PendingButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
