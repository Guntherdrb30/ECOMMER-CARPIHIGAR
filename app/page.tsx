import HeroCarousel from '@/components/hero-carousel';
import FeaturedCategories from '@/components/featured-categories';
import NewProducts from '@/components/new-products';
import { getSettings } from '@/server/actions/settings';

export default async function Home() {
  const settings = await getSettings();
  const images = Array.isArray((settings as any).homeHeroUrls)
    ? ((settings as any).homeHeroUrls as string[]).filter(Boolean)
    : undefined;
  return (
    <div>
      <HeroCarousel images={images} />
      <FeaturedCategories />
      <NewProducts />
    </div>
  );
}
