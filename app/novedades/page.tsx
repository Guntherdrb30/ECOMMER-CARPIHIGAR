import Link from 'next/link';
import { getLatestNews } from '@/server/actions/news';
import { getSettings } from '@/server/actions/settings';

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
  const [news, settings] = await Promise.all([
    getLatestNews(18),
    getSettings(),
  ]);

  const ecpdImages = Array.isArray((settings as any).ecpdHeroUrls)
    ? ((settings as any).ecpdHeroUrls as string[]).filter(Boolean)
    : [];

  const heroImage = ecpdImages[0] as string | undefined;

  return (
    <div className="bg-gray-50">
      {/* Hero grande para promocionar el personalizador */}
      <section className="bg-neutral-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-20 grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-300 mb-3">
              ECPD · PERSONALIZAR MUEBLES
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              Diseña tu mueble a medida
            </h1>
            <p className="text-sm md:text-lg text-gray-200 max-w-xl mb-6">
              Ajusta ancho, alto, fondo, cajones, baldas y acabados en tiempo real, con precio
              dinámico listo para producción. Lleva las novedades de tus proyectos a otro nivel.
            </p>
            <Link
              href="/personalizar-muebles"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-opacity-90 transition-colors text-sm md:text-base"
            >
              Abrir personalizador de muebles
            </Link>
          </div>
          <div className="w-full max-w-xl mx-auto">
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-neutral-800 shadow-2xl">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={encodeURI(heroImage)}
                  alt="Personalizador de muebles Carpihogar"
                  className="w-full h-64 md:h-80 object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] flex items-center justify-center text-xs md:text-sm text-gray-200 text-center px-4">
                  Configura imágenes del hero del personalizador en Ajustes · Home (mini hero ECPD).
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="contAuner mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
            Novedades de Nuestros Aliados
          </h2>
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
