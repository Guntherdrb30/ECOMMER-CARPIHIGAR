import { getSettings, updateSettings, getAuditLogs } from "@/server/actions/settings";
import LogoUploader from "@/components/admin/logo-uploader";
import HeroMediaUploader from "@/components/admin/hero-media-uploader";
import HeroCarouselEditor from "@/components/admin/hero-carousel-editor";
import EcpdColorsEditor from "@/components/admin/ecpd-colors-editor";
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
                primaryColor: (formData.get('primaryColor') as string) || undefined,
                secondaryColor: (formData.get('secondaryColor') as string) || undefined,
                logoUrl: (formData.get('logoUrl') as string) || undefined,
                lowStockThreshold: parseInt(String(formData.get('lowStockThreshold') ?? '5'), 10),
                homeHeroUrls: Array.from({ length: 3 }).map((_, i) => formData.get(`homeHeroUrl${i + 1}`) as string).filter(Boolean),
                ecpdHeroUrls: Array.from({ length: 3 }).map((_, i) => formData.get(`ecpdHeroUrl${i + 1}`) as string).filter(Boolean),
                heroAutoplayMs: parseInt(String(formData.get('heroAutoplayMs') || '5000'), 10),
                sellerCommissionPercent: parseFloat(String(formData.get('sellerCommissionPercent') || '5')),
                instagramHandle: String((formData.get('instagramHandle') as string) || '').replace(/^@+/, '').trim() || undefined,
                tiktokHandle: String((formData.get('tiktokHandle') as string) || '').replace(/^@+/, '').trim() || undefined,
                categoryBannerCarpinteriaUrl: (formData.get('categoryBannerCarpinteriaUrl') as string) || undefined,
                categoryBannerHogarUrl: (formData.get('categoryBannerHogarUrl') as string) || undefined,
                ecpdColors: Array.from({ length: 5 }).map((_, i) => {
                  const name = String(formData.get(`ecpdColorName${i}`) || '').trim();
                  const description = String(formData.get(`ecpdColorDescription${i}`) || '').trim();
                  const image = String(formData.get(`ecpdColorImage${i}`) || '').trim();
                  if (!name && !description && !image) return null;
                  return { name, description, image };
                }).filter(Boolean),
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
            <h3 className="text-lg font-semibold mb-2">Home (Página principal)</h3>
            <p className="text-sm text-gray-600 mb-3">Sube y ordena hasta 3 archivos (imagen o video) para el carrusel del hero.</p>
            <div className="mb-3">
              <label className="block text-gray-700">Autoplay del carrusel (ms)</label>
              <input type="number" name="heroAutoplayMs" min={1000} step={500} defaultValue={Number((settings as any).heroAutoplayMs || 5000)} className="w-full px-3 py-2 border rounded-lg" />
              <p className="text-xs text-gray-500">Recomendado: 5000 (5s). Con 1 sola imagen, no aplica.</p>
            </div>
            <HeroCarouselEditor defaultUrls={((settings as any).homeHeroUrls || []) as string[]} />
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Personalizador de muebles (mini hero)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Sube hasta 3 im�genes para el carrusel peque�o que promociona el personalizador de muebles en la p�gina de inicio.
            </p>
              <HeroCarouselEditor
                defaultUrls={((settings as any).ecpdHeroUrls || []) as string[]}
                fieldPrefix="ecpdHeroUrl"
              />
            </div>
            <EcpdColorsEditor defaultColors={((settings as any).ecpdColors || []) as any[]} />
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Categorías del Home</h3>
            <p className="text-sm text-gray-600 mb-3">Carga imágenes de fondo para las tarjetas de "Carpintería" y "Hogar".</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700">Imagen para Carpintería</label>
                <HeroMediaUploader targetInputName="categoryBannerCarpinteriaUrl" defaultUrl={(settings as any).categoryBannerCarpinteriaUrl || ''} />
                <input type="hidden" name="categoryBannerCarpinteriaUrl" defaultValue={(settings as any).categoryBannerCarpinteriaUrl || ''} />
              </div>
              <div>
                <label className="block text-gray-700">Imagen para Hogar</label>
                <HeroMediaUploader targetInputName="categoryBannerHogarUrl" defaultUrl={(settings as any).categoryBannerHogarUrl || ''} />
                <input type="hidden" name="categoryBannerHogarUrl" defaultValue={(settings as any).categoryBannerHogarUrl || ''} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700">Instagram (usuario)</label>
              <input
                type="text"
                name="instagramHandle"
                placeholder="@carpihogar.ai"
                defaultValue={(settings as any).instagramHandle || ''}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700">TikTok (usuario)</label>
              <input
                type="text"
                name="tiktokHandle"
                placeholder="@carpihogar.ai"
                defaultValue={(settings as any).tiktokHandle || ''}
                className="w-full px-3 py-2 border rounded-lg"
              />
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
