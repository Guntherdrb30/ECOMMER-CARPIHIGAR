import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSuppliers, importPurchasesCsv } from '@/server/actions/procurement';
import { PendingButton } from '@/components/pending-button';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CargaComprasPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session || role !== 'ADMIN') {
    return <div className="p-4">No autorizado</div> as any;
  }
  const suppliers = await getSuppliers();
  return (
    <div className="container mx-auto p-4 space-y-4">
      <ShowToastFromSearch param="ok" okMessage="Compra importada" errMessage="No se pudo importar" />
      <h1 className="text-2xl font-bold">Carga de Compras (CSV)</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-gray-600 mb-3">Sube un CSV con columnas: <code>code</code> (o sku/barcode), <code>name</code>, <code>quantity</code>, <code>costUSD</code>. También puedes usar <code>unitCost</code> o <code>cost</code>. Si los costos vienen en VES, selecciona "VES" y coloca la tasa.</p>
        <form action={async (formData) => { 'use server'; try { const r = await importPurchasesCsv(formData); redirect(`/dashboard/admin/compras/carga?ok=${encodeURIComponent(String((r as any)?.id || '1'))}`); } catch { redirect('/dashboard/admin/compras/carga?ok='); } }} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-700">Proveedor (opcional)</label>
            <select name="supplierId" className="form-select">
              <option value="">Sin proveedor</option>
              {suppliers.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Moneda</label>
            <select name="currency" className="form-select" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="VES">VES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Tasa VES</label>
            <input name="tasaVES" type="number" step="0.0001" defaultValue={0} className="form-input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700">Archivo CSV</label>
            <input name="file" type="file" accept=".csv,text/csv" required />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Separador</label>
            <select name="delimiter" className="form-select" defaultValue=",">
              <option value=",">, (coma)</option>
              <option value=";">; (punto y coma)</option>
            </select>
          </div>
          <div className="md:col-span-3 flex items-center gap-2">
            <PendingButton className="bg-green-600 text-white px-3 py-1 rounded" pendingText="Importando…">Importar</PendingButton>
            <a className="px-3 py-1 rounded border" href="/dashboard/admin/compras">Volver</a>
          </div>
        </form>
      </div>
    </div>
  );
}

