import Image from 'next/image';
import { getAllyPublicProfile } from '@/server/actions/allies';

export default async function AllyPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ally = await getAllyPublicProfile(id);
  if (!ally) {
    return <div className="container mx-auto px-4 py-16">Aliado no encontrado.</div>;
  }
  const services: string[] = Array.isArray((ally as any).services) ? ((ally as any).services as string[]) : [];
  const portfolio: string[] = Array.isArray((ally as any).portfolioUrls) ? ((ally as any).portfolioUrls as string[]) : [];

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-start gap-5">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {ally.profileImageUrl ? <img src={ally.profileImageUrl} alt={ally.name || 'Aliado'} className="w-full h-full object-cover" /> : null}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">{ally.name || 'Aliado'}</h1>
            <div className="mt-1 text-gray-600 text-sm">{ally.ordersCount} ventas · ${Number((ally as any).totalRevenueUSD || 0).toFixed(2)} facturado</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {services.slice(0, 8).map((s, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{s}</span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {ally.phone && (
                <a href={`https://wa.me/${String(ally.phone || '').replace(/[^0-9]/g,'')}`} target="_blank" className="px-4 py-2 rounded bg-green-600 text-white">WhatsApp</a>
              )}
              {ally.email && (
                <a href={`mailto:${ally.email}`} className="px-4 py-2 rounded bg-gray-800 text-white">Email</a>
              )}
            </div>
          </div>
        </div>

        {ally.bio && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Sobre mí</h2>
            <p className="text-gray-700 whitespace-pre-line">{ally.bio}</p>
          </div>
        )}

        {!!portfolio.length && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Mis trabajos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {portfolio.map((u, i) => (
                <div key={i} className="relative w-full aspect-square rounded overflow-hidden bg-gray-100">
                  <Image src={u} alt={`work-${i}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
