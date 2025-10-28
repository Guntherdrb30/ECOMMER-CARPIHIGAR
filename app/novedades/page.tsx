import Link from 'next/link';
import { getLatestNews } from '@/server/actions/news';

export default async function NovedadesPage() {
  const news = await getLatestNews(18);

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Novedades de Nuestros Aliados</h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Proyectos recientes subidos por la comunidad de aliados.
          </p>
        </div>

        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((n) => (
              <Link key={n.id} href={`/novedades/${n.id}`}>
                <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                  <div className="overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.imageUrl} alt={n.title || 'Proyecto'} className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand transition-colors duration-300 flex-grow">{n.title || 'Nuevo proyecto'}</h3>
                    {n.excerpt && <p className="text-gray-600 text-sm mb-4">{n.excerpt}</p>}
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-t border-gray-200 mt-16">
            <h2 className="text-2xl font-semibold text-gray-700">Próximamente</h2>
            <p className="mt-2 text-gray-500">Aún no hay novedades. Vuelve pronto.</p>
          </div>
        )}
      </div>
    </div>
  );
}

