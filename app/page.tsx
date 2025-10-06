import HeroCarousel from '@/components/hero-carousel';
import FeaturedCategories from '@/components/featured-categories';
import NewProducts from '@/components/new-products';

export default function Home() {
  return (
    <div>
      <HeroCarousel />
      <FeaturedCategories />
      <NewProducts />
    </div>
  );
}