import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSuppliers } from '@/server/actions/procurement';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import PurchaseCsvUploader from '@/components/admin/purchase-csv-uploader';

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
        <p className="text-sm text-gray-600 mb-3">Sube un CSV con columnas: <code>code</code> (o sku/barcode), <code>name</code>, <code>quantity</code>, <code>costUSD</code>. También puedes usar <code>unitCost</code> o <code>cost</code>. Si los costos vienen en VES, selecciona "VES" y coloca la tasa. Verás una previsualización antes de guardar.</p>
        <PurchaseCsvUploader suppliers={suppliers as any} />
        <div className="mt-3">
          <a className="text-sm text-blue-600 underline" href="/samples/purchases_template.csv" download>Descargar plantilla CSV de compras</a>
        </div>
      </div>
    </div>
  );
}
