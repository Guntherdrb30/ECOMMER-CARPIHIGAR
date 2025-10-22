import Link from 'next/link';
import { getFeaturedCategoryBanners } from '@/server/actions/products';

type CategoryCard = { name: string; href: string; image: string };

const FeaturedCategoryCard = ({ category }: { category: CategoryCard }) => {
  const hasImg = !!category.image && !category.image.includes('/images/hero-');
  const style = hasImg ? { backgroundImage: `url('${category.image}')` } : undefined;
  return (
  <Link href={category.href} className="relative block group h-96">
    <div
      className={`absolute inset-0 ${hasImg ? 'bg-cover bg-center' : 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)] bg-[length:20px_20px] bg-neutral-700'} rounded-lg transition-transform duration-500 group-hover:scale-105`}
      style={style}
    ></div>
    <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
    <div className="relative h-full flex flex-col items-center justify-center text-white text-center p-4">
      <h3 className="text-4xl font-extrabold">{category.name}</h3>
      <p className="mt-2 text-lg">Explorar categoría</p>
    </div>
  </Link>
)};

export default async function FeaturedCategories() {
  const banners = await getFeaturedCategoryBanners();
  const categories: CategoryCard[] = banners.map((b) => ({ name: b.name, href: b.href, image: b.image }));
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Categorías Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <FeaturedCategoryCard key={category.name} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
