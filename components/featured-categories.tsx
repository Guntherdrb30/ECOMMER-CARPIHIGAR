import Link from 'next/link';
import Image from 'next/image';
import { shimmer, toBase64 } from '@/lib/image-placeholder';
import { getFeaturedCategoryBannersNoCache } from '@/server/actions/featured';

type CategoryCard = { name: string; href: string; image: string };

const FeaturedCategoryCard = ({ category }: { category: CategoryCard }) => {
  const hasImg = !!category.image && !category.image.includes('/images/hero-');
  return (
  <Link href={category.href} className="relative block group h-96">
    {hasImg ? (
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1200, 600, 16))}`}
      />
    ) : (
      <div className="absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)] bg-[length:20px_20px] bg-neutral-700 transition-transform duration-500 group-hover:scale-105" />
    )}
    <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
    <div className="relative h-full flex flex-col items-center justify-center text-white text-center p-4">
      <h3 className="text-4xl font-extrabold">{category.name}</h3>
      <p className="mt-2 text-lg">Explorar categoría</p>
    </div>
  </Link>
)};

export default async function FeaturedCategories() {
  const banners = await getFeaturedCategoryBannersNoCache();
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

