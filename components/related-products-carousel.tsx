'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ProductCard from './product-card';
import type { Product } from '@prisma/client';

// Dynamically import Swiper to avoid SSR/runtime issues
const Swiper = dynamic(() => import('swiper/react').then((m) => m.Swiper), { ssr: false });
const SwiperSlide = dynamic(() => import('swiper/react').then((m) => m.SwiperSlide), { ssr: false });

type ProductWithCategory = Product & {
    category: {
        name: string;
    } | null;
};

interface RelatedProductsCarouselProps {
  products: ProductWithCategory[];
  settings: any;
}

export default function RelatedProductsCarousel({ products, settings }: RelatedProductsCarouselProps) {
  if (!products.length) {
    return null;
  }

  const [mods, setMods] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    import('swiper/modules').then(({ Navigation, Pagination }) => {
      if (mounted) setMods([Navigation, Pagination]);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="py-12">
      {mods.length > 0 && (
        <Swiper
          modules={mods as any}
          spaceBetween={30}
          slidesPerView={3}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            320: { slidesPerView: 1, spaceBetween: 10 },
            640: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 30 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
          }}
          className="!pb-12"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard
                product={product}
                tasa={settings.tasaVES}
                whatsappPhone={(settings as any).whatsappPhone}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
