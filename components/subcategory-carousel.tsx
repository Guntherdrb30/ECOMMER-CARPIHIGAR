"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

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
                <Link href={`/productos?categoria=${c.slug}`} className="group relative block rounded-lg overflow-hidden shadow hover:shadow-lg transition-all bg-white aspect-square">
                  {hasImg ? (
                    <Image
                      src={c.image as string}
                      alt={c.name}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      placeholder="blur"
                      blurDataURL="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 h-full p-3 flex flex-col justify-end text-white">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    {typeof c.productCount === 'number' && (
                      <div className="text-[11px] opacity-90">{c.productCount} productos</div>
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
