import HeroCarousel from '@/components/hero-carousel-simple';
import NewProducts from '@/components/new-products';
import TrendingProducts from '@/components/trending-products';
import AlliesRanking from '@/components/allies-ranking';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { getSettings } from '@/server/actions/settings';
import Link from 'next/link';

export default async function Home() {
  const settings = await getSettings();
  const images = Array.isArray((settings as any).homeHeroUrls)
    ? ((settings as any).homeHeroUrls as string[]).filter(Boolean)
    : undefined;
  return (
    <div>
      <HeroCarousel
        images={images}
        autoplayMs={Number((settings as any).heroAutoplayMs || 5000)}
      />
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Personaliza tus muebles Carpihogar
            </h2>
            <p className="text-gray-600 max-w-xl">
              Diseña armarios y muebles a medida con nuestro nuevo motor de
              configuración dinámico. Ajusta dimensiones, componentes y
              acabados y obtén un precio en tiempo real.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/personalizar-muebles"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-opacity-90 transition-colors"
            >
              Personalizar muebles
            </Link>
          </div>
        </div>
      </section>
      <NewProducts />
      <TrendingProducts />
      <AlliesRanking />
    </div>
  );
}
