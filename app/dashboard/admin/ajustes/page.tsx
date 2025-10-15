import { getSettings, updateSettings, getAuditLogs } from "@/server/actions/settings";
import LogoUploader from "@/components/admin/logo-uploader";
import HeroMediaUploader from "@/components/admin/hero-media-uploader";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ShowToastFromSearch from '@/components/show-toast-from-search';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = ((session?.user as any)?.role) === 'ADMIN';
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Ajustes del Sitio</h1>
        <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">No autorizado</div>
      </div>
    );
  }

  const [settings, logs] = await Promise.all([
    getSettings(),
    (async () => { try { return await getAuditLogs({ take: 50 }); } catch { return [] as any[]; } })(),
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ajustes del Sitio</h1>
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <ShowToastFromSearch successParam="message" errorParam="error" />
        <form noValidate action={async (formData) => {
            'use server';
            const data = {
                brandName: formData.get('brandName') as string,
                whatsappPhone: formData.get('whatsappPhone') as string,
                contactPhone: formData.get('contactPhone') as string,
                contactEmail: formData.get('contactEmail') as string,
                ivaPercent: parseFloat(formData.get('ivaPercent') as string),
                tasaVES: parseFloat(formData.get('tasaVES') as string),
                primaryColor: (formData.get('primaryColor') as string) || undefined,
                secondaryColor: (formData.get('secondaryColor') as string) || undefined,
                logoUrl: (formData.get('logoUrl') as string) || undefined,
                lowStockThreshold: parseInt(String(formData.get('lowStockThreshold') ?? '5'), 10),
                homeHeroUrl1: (formData.get('homeHeroUrl1') as string) || undefined,
                homeHeroUrl2: (formData.get('homeHeroUrl2') as string) || undefined,
                homeHeroUrl3: (formData.get('homeHeroUrl3') as string) || undefined,
                homeHeroUrls: Array.from({ length: 3 }).map((_, i) => formData.get(`homeHeroUrl${i + 1}`) as string).filter(Boolean),
                sellerCommissionPercent: parseFloat(String(formData.get('sellerCommissionPercent') || '5')),
            };
            await updateSettings(data);
            const { redirect } = await import('next/navigation');
            redirect('/dashboard/admin/ajustes?message=Cambios%20guardados');
        }}>
          <div className="mb-4">
            <label className="block text-gray-700">Nombre de la Marca</label>
            <input
              type="text"
              name="brandName"
              defaultValue={settings.brandName}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Teléfono de WhatsApp</label>
            <input
              type="text"
              name="whatsappPhone"
              defaultValue={settings.whatsappPhone}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Teléfono de Contacto</label>
            <input
              type="text"
              name="contactPhone"
              defaultValue={settings.contactPhone}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email de Contacto</label>
            <input
              type="email"
              name="contactEmail"
              defaultValue={settings.contactEmail}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Porcentaje de IVA</label>
            <input
              type="number"
              name="ivaPercent"
              step="0.01"
              defaultValue={settings.ivaPercent.toString()}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tasa VES</label>
            <input
              type="number"
              name="tasaVES"
              step="0.01"
              defaultValue={settings.tasaVES.toString()}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Comisión Vendedor (%)</label>
            <input
              type="number"
              name="sellerCommissionPercent"
              step="0.01"
              defaultValue={(settings as any).sellerCommissionPercent?.toString?.() || '5'}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700">Color primario</label>
              <input type="color" name="primaryColor" defaultValue={(settings as any).primaryColor || '#FF4D00'} className="w-full h-10 border rounded" />
              <p className="text-xs text-gray-500 mt-1">Al subir un logo, detectamos su color y lo aplicamos automáticamente.</p>
            </div>
            <div>
              <label className="block text-gray-700">Color secundario</label>
              <input type="color" name="secondaryColor" defaultValue={(settings as any).secondaryColor || '#111827'} className="w-full h-10 border rounded" />
            </div>
            <div>
              <label className="block text-gray-700">Logo</label>
              <p className="text-xs text-gray-500 mb-1">Sube una imagen desde tu PC. Se guardará y usará como logo.</p>
              <div className="mt-2">
                <LogoUploader targetInputName="logoUrl" defaultUrl={(settings as any).logoUrl || ''} />
              </div>
              <input type="hidden" name="logoUrl" defaultValue={(settings as any).logoUrl || ''} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Home (Pagina principal)</h3>
            <p className="text-sm text-gray-600 mb-3">Sube hasta 3 archivos (imagen o video) para el carrusel del hero.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => {
                const index = i + 1;
                const fieldName = `homeHeroUrl${index}`;
                const defaultUrl = ((settings as any).homeHeroUrls?.[i]) || '';

                return (
                  <div key={fieldName} className="border p-3 rounded-lg">
                    <label className="block text-gray-700 font-medium">Medio del Carrusel #{index}</label>
                    <p className="text-xs text-gray-500 mb-2">Esta sera la posicion #{index} del hero.</p>
                    <div className="mt-2">
                      <HeroMediaUploader targetInputName={fieldName} defaultUrl={defaultUrl} />
                    </div>
                    <input type="hidden" name={fieldName} defaultValue={defaultUrl} />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Umbral de stock bajo</label>
            <input
              type="number"
              name="lowStockThreshold"
              min={0}
              defaultValue={(settings as any).lowStockThreshold ?? 5}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">
            Guardar Cambios
          </button>
        </form>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h2 className="text-lg font-bold mb-2">Historial de Seguridad (Audit Log)</h2>
        <p className="text-sm text-gray-600 mb-2">Ultimos 50 eventos registrados del sistema.</p>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Accion</th>
                <th className="px-3 py-2 text-left">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td className="border px-3 py-2">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="border px-3 py-2">{l.userId || '-'}</td>
                  <td className="border px-3 py-2">{l.action}</td>
                  <td className="border px-3 py-2">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
