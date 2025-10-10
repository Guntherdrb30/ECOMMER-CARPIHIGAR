import { getSettings, updateSettings, getAuditLogs } from "@/server/actions/settings";
import LogoUploader from "@/components/admin/logo-uploader";
import ShowToastFromSearch from '@/components/show-toast-from-search';
import PendingButton from '@/components/pending-button';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const email = String((session?.user as any)?.email || '').toLowerCase();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const isRoot = isAdmin && email === rootEmail;

  const settings = await getSettings();
  let logs: any[] = [];
  if (isAdmin) {
    try {
      logs = await getAuditLogs({ take: 50 });
    } catch {
      logs = [];
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ajustes del Sitio</h1>
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <form
          noValidate
          action={async (formData) => {
            'use server';
            const homeHeroUrls: string[] = [];
            for (let i = 1; i <= 6; i++) {
              const url = formData.get(`homeHeroUrl${i}`) as string;
              if (url) homeHeroUrls.push(url);
            }
            const data = {
              brandName: formData.get('brandName') as string,
              whatsappPhone: formData.get('whatsappPhone') as string,
              contactPhone: formData.get('contactPhone') as string,
              contactEmail: formData.get('contactEmail') as string,
              ivaPercent: parseFloat(String(formData.get('ivaPercent') || '0')),
              tasaVES: parseFloat(String(formData.get('tasaVES') || '0')),
              primaryColor: (formData.get('primaryColor') as string) || undefined,
              secondaryColor: (formData.get('secondaryColor') as string) || undefined,
              logoUrl: (formData.get('logoUrl') as string) || undefined,
              lowStockThreshold: parseInt(String(formData.get('lowStockThreshold') ?? '5'), 10),
              homeHeroUrls,
              sellerCommissionPercent: parseFloat(String(formData.get('sellerCommissionPercent') || '5')),
            };
            try {
              await updateSettings(data);
              redirect('/dashboard/admin/ajustes?ajustes=ok');
            } catch {
              redirect('/dashboard/admin/ajustes?ajustes=err');
            }
          }}
        >
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
              <input
                type="color"
                name="primaryColor"
                defaultValue={(settings as any).primaryColor || '#FF4D00'}
                className="w-full h-10 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Al subir un logo, detectamos su color y lo aplicamos automáticamente.
              </p>
            </div>
            <div>
              <label className="block text-gray-700">Color secundario</label>
              <input
                type="color"
                name="secondaryColor"
                defaultValue={(settings as any).secondaryColor || '#111827'}
                className="w-full h-10 border rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700">Logo</label>
              <p className="text-xs text-gray-500 mb-1">
                Sube una imagen desde tu PC. Se guardará y usará como logo.
              </p>
              <div className="mt-2">
                <LogoUploader targetInputName="logoUrl" defaultUrl={(settings as any).logoUrl || ''} />
              </div>
              <input type="hidden" name="logoUrl" defaultValue={(settings as any).logoUrl || ''} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Home (Página principal)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Sube las 6 imágenes para el carrusel de la página de inicio.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => {
                const index = i + 1;
                const fieldName = `homeHeroUrl${index}`;
                const defaultUrl = (settings.homeHeroUrls && settings.homeHeroUrls[i]) || '';
                return (
                  <div key={fieldName} className="border p-3 rounded-lg">
                    <label className="block text-gray-700 font-medium">Imagen del Carrusel #{index}</label>
                    <p className="text-xs text-gray-500 mb-2">
                      Sube la imagen que aparecerá en la posición #{index} del carrusel.
                    </p>
                    <div className="mt-2">
                      <LogoUploader targetInputName={fieldName} defaultUrl={defaultUrl} />
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
          <PendingButton className="w-full bg-blue-500 text-white py-2 rounded-lg" pendingText="Guardando...">
            Guardar Cambios
          </PendingButton>
        </form>
      </div>
      <ShowToastFromSearch
        param="ajustes"
        okMessage="Ajustes guardados"
        errMessage="No se pudieron guardar los ajustes"
      />
      {isRoot && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h2 className="text-lg font-bold mb-2">Ajustes del Sistema (Root)</h2>
          <p className="text-sm text-gray-600 mb-3">
            Accede a la gestión de la clave de eliminación y opciones avanzadas de seguridad.
          </p>
          <a
            href="/dashboard/admin/ajustes/sistema"
            className="inline-block px-3 py-2 bg-gray-800 text-white rounded"
          >
            Ir a Ajustes del Sistema
          </a>
        </div>
      )}
      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h2 className="text-lg font-bold mb-2">Historial de Seguridad (Audit Log)</h2>
        <p className="text-sm text-gray-600 mb-2">Últimos 50 eventos registrados del sistema.</p>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Acción</th>
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

