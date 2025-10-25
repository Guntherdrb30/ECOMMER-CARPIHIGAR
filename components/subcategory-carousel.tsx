"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const Swiper = dynamic(() => import('swiper/react').then((m) => m.Swiper), { ssr: false });
const SwiperSlide = dynamic(() => import('swiper/react').then((m) => m.SwiperSlide), { ssr: false });

type SubCat = { id: string; name: string; slug: string; image?: string; productCount?: number };

export default function SubcategoryCarousel({ items }: { items: SubCat[] }) {
  const [mods, setMods] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    import('swiper/modules').then(({ Navigation, Pagination }) => {
      if (mounted) setMods([Navigation, Pagination]);
    });
    return () => { mounted = false; };
  }, []);

  if (!items?.length) return null;

  return (
    <div className="py-2">
      {mods.length > 0 && (
        <Swiper
          modules={mods as any}
          spaceBetween={16}
          slidesPerView={2}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            480: { slidesPerView: 2, spaceBetween: 16 },
            640: { slidesPerView: 3, spaceBetween: 18 },
            768: { slidesPerView: 4, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 22 },
          }}
          className="!pb-10"
        >
          {items.map((c) => {
            const hasImg = !!c.image;
            return (
              <SwiperSlide key={c.id}>
                <Link href={`/productos?categoria=${c.slug}`} className="block group rounded-lg overflow-hidden shadow hover:shadow-lg bg-white">
                  <div className={`h-36 ${hasImg ? 'bg-cover bg-center' : 'bg-gray-200'} transition-transform duration-500 group-hover:scale-105`} style={hasImg ? { backgroundImage: `url('${c.image}')` } : undefined} />
                  <div className="px-3 py-2">
                    <div className="text-sm font-semibold text-gray-800 truncate">{c.name}</div>
                    {typeof c.productCount === 'number' && (
                      <div className="text-xs text-gray-500">{c.productCount} productos</div>
                    )}
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </div>
  );
}

