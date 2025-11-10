import Link from 'next/link';
import { getLatestNews } from '@/server/actions/news';

function extractCourseSlug(excerpt?: string | null): string | null {
  if (!excerpt) return null;
  const m = excerpt.match(/curso:\/cursos\/([a-z0-9\-]+)/i);
  return m ? m[1] : null;
}

function extractStartDate(excerpt?: string | null): Date | null {
  if (!excerpt) return null;
  const m = excerpt.match(/Inicia:\s*(\d{4}-\d{2}-\d{2})/i);
  if (!m) return null;
  try { return new Date(m[1] + 'T00:00:00'); } catch { return null; }
}

export default async function NovedadesPage() {
  const news = await getLatestNews(18);

  return (
    <div className="bg-gray-50">
      <div className="contAuner mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Novedades de Nuestros Aliados</h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Proyectos recientes subidos por la comunidad de aliados.
          </p>
        </div>

        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((n) => {
              const slug = extractCourseSlug(n.excerpt);
              const start = extractStartDate(n.excerpt);
              const now = new Date();
              const diff = start ? Math.max(0, (start.getTime() - now.getTime()) / 1000) : null;
              const d = diff != null ? Math.floor(diff / 86400) : null;
              const h = diff != null ? Math.floor((diff % 86400) / 3600) : null;
              const m = diff != null ? Math.floor((diff % 3600) / 60) : null;
              return (
                <div key={n.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                  <Link href={`/novedades/${n.id}`} className="overflow-hidden block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.imageUrl} alt={n.title || 'Proyecto'} className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300" />
                  </Link>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand transition-colors duration-300 flex-grow">{n.title || 'Nuevo proyecto'}</h3>
                    {n.excerpt && <p className="text-gray-600 text-sm mb-4">{n.excerpt}</p>}
                    {slug && (
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/cursos/${slug}`} className="atlas-button rounded px-3 py-1.5 text-sm">Ver curso</Link>
                        {start ? (<span className="text-xs text-gray-600">Comienza en {d}d {h}h {m}m</span>) : null}
                      </div>
                    )}
                    <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                      {n.author?.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.author.profileImageUrl} alt={n.author?.name || 'Aliado'} className="w-9 h-9 rounded-full mr-3" />
                      ) : (
                        <div className="w-9 h-9 rounded-full mr-3 bg-gray-200" />
                      )}
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{n.author?.name || 'Aliado'}</p>
                        <p className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border-t border-gray-200 mt-16">
            <h2 className="text-2xl font-semibold text-gray-700">Proximamente</h2>
            <p className="mt-2 text-gray-500">Aún no hay novedades. Vuelve pronto.</p>
          </div>
        )}
      </div>
    </div>
  );
}
