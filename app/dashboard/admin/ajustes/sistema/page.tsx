import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDeleteSecret, setDeleteSecret, getSettings, setDefaultMargins, setPaymentInstructions } from '@/server/actions/settings';
import { setRootRecoverySettings } from '@/server/actions/root-recovery';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { PendingButton } from '@/components/pending-button';
import { redirect } from 'next/navigation';

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || {};
  const email = String(user?.email || '').toLowerCase();
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const isAdmin = user?.role === 'ADMIN';
  const isRoot = isAdmin && email === rootEmail;
  if (!isAdmin) {
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
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <h1 className="text-2xl font-bold">Ajustes del Sistema</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Clave de eliminación</h2>
        <p className="text-sm text-gray-600 mb-3">Esta clave se usa para autorizar eliminaciones sensibles (abonos, productos, categorías, etc.).</p>
        <div className="mb-3 text-sm text-gray-700">Estado: {current ? 'Configurada' : 'No configurada'}</div>
        <form action={async (formData) => { 'use server'; try { await (setDeleteSecret as any)(formData); redirect('/dashboard/admin/ajustes/sistema?message=Clave%20cambiada'); } catch (e: any) { const m = encodeURIComponent(String(e?.message || 'No se pudieron guardar los cambios')); redirect('/dashboard/admin/ajustes/sistema?error=' + m); } }} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
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
        <h2 className="text-lg font-semibold mb-2">Datos de pago (Root)</h2>
        <p className="text-sm text-gray-600 mb-3">Estos datos aparecen en el formulario de pago para que el cliente pueda copiarlos facilmente.</p>
        <form action={async (formData) => { 'use server'; try { await (setPaymentInstructions as any)(formData); redirect('/dashboard/admin/ajustes/sistema?message=Pagos%20actualizados'); } catch (e: any) { const m = encodeURIComponent(String(e?.message || 'No se pudieron guardar los cambios')); redirect('/dashboard/admin/ajustes/sistema?error=' + m); } }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3 font-semibold">USD · Zelle</div>
          <div>
            <label className="block text-sm text-gray-700">Correo Zelle</label>
            <input name="paymentZelleEmail" defaultValue={(siteSettings as any).paymentZelleEmail || ''} className="border rounded px-2 py-1 w-full" placeholder="zelle@empresa.com" />
          </div>

          <div className="md:col-span-3 font-semibold mt-4">VES · Pago Movil</div>
          <div>
            <label className="block text-sm text-gray-700">Telefono</label>
            <input name="paymentPmPhone" defaultValue={(siteSettings as any).paymentPmPhone || ''} className="border rounded px-2 py-1 w-full" placeholder="0412-XXXXXXX" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">RIF</label>
            <input name="paymentPmRif" defaultValue={(siteSettings as any).paymentPmRif || ''} className="border rounded px-2 py-1 w-full" placeholder="J-XXXXXXXX-X" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Banco</label>
            <input name="paymentPmBank" defaultValue={(siteSettings as any).paymentPmBank || ''} className="border rounded px-2 py-1 w-full" placeholder="Nombre del banco" />
          </div>

          <div className="md:col-span-3 font-semibold mt-4">Depositos/Transferencias · Banesco</div>
          <div>
            <label className="block text-sm text-gray-700">Nombre del titular</label>
            <input name="paymentBanescoName" defaultValue={(siteSettings as any).paymentBanescoName || ''} className="border rounded px-2 py-1 w-full" placeholder="Nombre del titular" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Numero de cuenta</label>
            <input name="paymentBanescoAccount" defaultValue={(siteSettings as any).paymentBanescoAccount || ''} className="border rounded px-2 py-1 w-full" placeholder="0000-0000-00-0000000000" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">RIF</label>
            <input name="paymentBanescoRif" defaultValue={(siteSettings as any).paymentBanescoRif || ''} className="border rounded px-2 py-1 w-full" placeholder="J-XXXXXXXX-X" />
          </div>

          <div className="md:col-span-3 font-semibold mt-4">Depositos/Transferencias · Mercantil</div>
          <div>
            <label className="block text-sm text-gray-700">Nombre del titular</label>
            <input name="paymentMercantilName" defaultValue={(siteSettings as any).paymentMercantilName || ''} className="border rounded px-2 py-1 w-full" placeholder="Nombre del titular" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Numero de cuenta</label>
            <input name="paymentMercantilAccount" defaultValue={(siteSettings as any).paymentMercantilAccount || ''} className="border rounded px-2 py-1 w-full" placeholder="0000-0000-00-0000000000" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">RIF</label>
            <input name="paymentMercantilRif" defaultValue={(siteSettings as any).paymentMercantilRif || ''} className="border rounded px-2 py-1 w-full" placeholder="J-XXXXXXXX-X" />
          </div>

          <div className="md:col-span-3 flex gap-2 mt-2">
            <PendingButton className="px-3 py-2 bg-blue-600 text-white rounded" pendingText="Guardando...">Guardar datos</PendingButton>
            <a className="px-3 py-2 border rounded" href="/dashboard/admin/ajustes">Volver a ajustes</a>
          </div>
        </form>
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
