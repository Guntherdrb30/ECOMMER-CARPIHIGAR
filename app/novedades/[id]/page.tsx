import { getNewsById } from '@/server/actions/news';
import Link from 'next/link';

export default async function NovedadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = await getNewsById(id);
  if (!n) {
    return <div className="container mx-auto px-4 py-16">Novedad no encontrada.</div>;
  }
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            {n.author?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.author.profileImageUrl} alt={n.author?.name || 'Aliado'} className="w-12 h-12 rounded-full border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200" />
            )}
            <div>
              <div className="font-semibold text-gray-900">{n.author?.name || 'Aliado'}</div>
              <div className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">{n.title || 'Nuevo proyecto'}</h1>
          {n.excerpt && <p className="text-gray-700 mb-6 whitespace-pre-line">{n.excerpt}</p>}

          <div className="rounded-xl overflow-hidden shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.imageUrl} alt={n.title || 'Proyecto'} className="w-full h-auto object-cover" />
          </div>

          {n.author?.id && (
            <div className="mt-8">
              <Link href={`/aliados/${n.author.id}`} className="inline-block px-4 py-2 rounded bg-brand text-white">Ver perfil del aliado</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

