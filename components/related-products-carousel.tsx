'use client';

import ProductCard from './product-card';
import type { Product } from '@prisma/client';

type ProductWithCategory = Product & {
  category: {
    name: string;
  } | null;
};

interface RelatedProductsCarouselProps {
  products: ProductWithCategory[];
  settings: any;
}

export default function RelatedProductsCarousel({
  products,
  settings,
}: RelatedProductsCarouselProps) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tasa={settings.tasaVES}
            whatsappPhone={(settings as any).whatsappPhone}
          />
        ))}
      </div>
    </div>
  );
}
