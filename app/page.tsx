import HeroCarousel from '@/components/hero-carousel-simple';
import FeaturedCategories from '@/components/featured-categories';
import NewProducts from '@/components/new-products';
import TrendingProducts from '@/components/trending-products';
import AlliesRanking from '@/components/allies-ranking';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import { getSettings } from '@/server/actions/settings';

export default async function Home() {
  const settings = await getSettings();
  const images = Array.isArray((settings as any).homeHeroUrls)
    ? ((settings as any).homeHeroUrls as string[]).filter(Boolean)
    : undefined;
  return (
    <div>
      <HeroCarousel images={images} autoplayMs={Number((settings as any).heroAutoplayMs || 5000)} />
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <FeaturedCategories />
      <NewProducts />
      <TrendingProducts />
      <AlliesRanking />
    </div>
  );
}



