import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDeleteSecret, setDeleteSecret, getSettings, setDefaultMargins } from '@/server/actions/settings';
import { setRootRecoverySettings } from '@/server/actions/root-recovery';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { PendingButton } from '@/components/pending-button';
import { redirect } from 'next/navigation';

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || {};
  const email = String(user?.email || '').toLowerCase();
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const isRoot = user?.role === 'ADMIN' && email === rootEmail;
  if (!isRoot) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Ajustes del Sistema</h1>
        <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">No autorizado</div>
      </div>
    );
  }
  const [current, siteSettings] = await Promise.all([
    getDeleteSecret(),
    getSettings(),
  ]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <ShowToastFromSearch param="sys" okMessage="Cambios guardados" errMessage="No se pudieron guardar los cambios" />
      <h1 className="text-2xl font-bold">Ajustes del Sistema (Root)</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Clave de eliminación</h2>
        <p className="text-sm text-gray-600 mb-3">Esta clave se usa para autorizar eliminaciones sensibles (abonos, productos, categorías, etc.).</p>
        <div className="mb-3 text-sm text-gray-700">Estado: {current ? 'Configurada' : 'No configurada'}</div>
        <form action={async (formData) => { 'use server'; try { await (setDeleteSecret as any)(formData); redirect('/dashboard/admin/ajustes/sistema?sys=ok'); } catch { redirect('/dashboard/admin/ajustes/sistema?sys=err'); } }} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
          <div>
            <label className="block text-sm text-gray-700">Nueva clave</label>
            <input name="newSecret" type="password" minLength={6} required className="border rounded px-2 py-1 w-full" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Confirmar clave</label>
            <input name="confirm" type="password" minLength={6} required className="border rounded px-2 py-1 w-full" placeholder="Repite la clave" />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <PendingButton className="px-3 py-2 bg-blue-600 text-white rounded" pendingText="Guardando…">Guardar clave</PendingButton>
            <a className="px-3 py-2 border rounded" href="/dashboard/admin/ajustes">Volver a ajustes</a>
          </div>
        </form>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Recuperación de Root por WhatsApp</h2>
        <p className="text-sm text-gray-600 mb-3">Configura el número de WhatsApp del Root y una clave de recuperación (se almacena de forma segura). Servirá para solicitar un código de recuperación y restablecer la contraseña del usuario root.</p>
        <form
          action={async (formData) => { 'use server'; formData.set('email', String(email)); try { await setRootRecoverySettings(formData); redirect('/dashboard/admin/ajustes/sistema?sys=ok'); } catch { redirect('/dashboard/admin/ajustes/sistema?sys=err'); } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl"
        >
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700">Teléfono WhatsApp del Root (E.164, ej: +58412XXXXXXX)</label>
            <input name="rootPhone" type="tel" required className="border rounded px-2 py-1 w-full" placeholder="+58..." defaultValue={(siteSettings as any).rootPhone || ''} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Nueva clave de recuperación</label>
            <input name="rootSecret" type="password" minLength={6} className="border rounded px-2 py-1 w-full" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Confirmar clave de recuperación</label>
            <input name="rootSecretConfirm" type="password" minLength={6} className="border rounded px-2 py-1 w-full" placeholder="Repite la clave" />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <PendingButton className="px-3 py-2 bg-blue-600 text-white rounded" pendingText="Guardando…">Guardar recuperación</PendingButton>
            <a className="px-3 py-2 border rounded" href="/dashboard/admin/ajustes">Volver a ajustes</a>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3">Para envío automático por WhatsApp, configura variables: <code>WHATSAPP_CLOUD_ACCESS_TOKEN</code> y <code>WHATSAPP_CLOUD_PHONE_ID</code>. Sin ellas, se registra en consola (modo desarrollo).</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Ganancias de productos (márgenes %)</h2>
        <p className="text-sm text-gray-600 mb-3">Se usan para calcular precios a partir del costo al importar compras o productos por CSV.</p>
        <form action={async (formData) => { 'use server'; try { await setDefaultMargins(formData); redirect('/dashboard/admin/ajustes/sistema?sys=ok'); } catch { redirect('/dashboard/admin/ajustes/sistema?sys=err'); } }} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
          <div>
            <label className="block text-sm text-gray-700">Cliente (%)</label>
            <input name="defaultMarginClientPct" type="number" step="0.01" min="0" defaultValue={Number((siteSettings as any).defaultMarginClientPct ?? 40)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Aliado (%)</label>
            <input name="defaultMarginAllyPct" type="number" step="0.01" min="0" defaultValue={Number((siteSettings as any).defaultMarginAllyPct ?? 30)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Mayorista (%)</label>
            <input name="defaultMarginWholesalePct" type="number" step="0.01" min="0" defaultValue={Number((siteSettings as any).defaultMarginWholesalePct ?? 20)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <PendingButton className="px-3 py-2 bg-blue-600 text-white rounded" pendingText="Guardando…">Guardar márgenes</PendingButton>
            <a className="px-3 py-2 border rounded" href="/dashboard/admin/ajustes">Volver a ajustes</a>
          </div>
        </form>
      </div>
    </div>
  );
}
