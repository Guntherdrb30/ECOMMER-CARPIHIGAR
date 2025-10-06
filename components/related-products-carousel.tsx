'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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

export default function RelatedProductsCarousel({ products, settings }: RelatedProductsCarouselProps) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="py-12">
      <Swiper
        modules={[Navigation, Pagination]}
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
        className="!pb-12" // Add padding bottom for pagination
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} tasa={settings.tasaVES} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
