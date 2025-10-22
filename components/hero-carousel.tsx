'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// no fade effect to avoid conflicts with videos
import Link from 'next/link';

// Dynamically import Swiper parts to avoid SSR issues in production
const Swiper = dynamic(() => import('swiper/react').then((m) => m.Swiper), { ssr: false });
const SwiperSlide = dynamic(() => import('swiper/react').then((m) => m.SwiperSlide), { ssr: false });

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  href: string;
}

type Props = {
  images?: string[];
  autoplayMs?: number;
};

function buildSlides(images?: string[]): HeroSlide[] {
  const normalized = (images || []).filter(Boolean);
  return normalized.map((img, idx) => ({
    image: encodeURI(img),
    title: idx === 0 ? 'Descubre Carpihogar' : idx === 1 ? 'Renueva tu Hogar con Estilo' : 'Calidad y Diseño',
    subtitle: 'Encuentra los mejores productos para tus proyectos y tu hogar.',
    href: '/productos',
  }));
}

export default function HeroCarousel({ images, autoplayMs }: Props) {
  const slides = buildSlides(images);
  const slideCount = slides.length;
  const [mods, setMods] = useState<any[]>([]);
  const paginationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        console.log('[HeroCarousel] slides', slideCount, slides);
      }
    } catch {}
  }, [slideCount]);

  useEffect(() => {
    let mounted = true;
    import('swiper/modules')
      .then(({ Navigation, Pagination, Autoplay }) => {
        if (mounted) setMods([Navigation, Pagination, Autoplay]);
      })
      .catch((e) => {
        console.error('[HeroCarousel] Failed to load Swiper modules', e);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasMods = mods.length > 0;
  const loopEnabled = false; // evitamos warnings de loop; usamos rewind
  const first = slides[0];
  const firstIsVideo = !!first && (first.image.toLowerCase().endsWith('.mp4') || first.image.toLowerCase().endsWith('.webm') || first.image.toLowerCase().endsWith('.ogg'));
  const sectionStyle = !firstIsVideo && first?.image ? ({ backgroundImage: `url('${first.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } as CSSProperties) : undefined;

  if (!slideCount) {
    return (
      <section className="relative h-[45vh] sm:h-[55vh] md:h-[70vh] lg:h-[80vh] min-h-[320px] w-full bg-black text-white flex items-center">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">Carpihogar</h1>
          <p className="text-sm text-gray-300 mt-2">Configura imágenes del hero en Ajustes.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[45vh] sm:h-[55vh] md:h-[70vh] lg:h-[80vh] min-h-[320px] w-full text-white bg-black" style={sectionStyle}>
      {hasMods ? (
        <Swiper
          modules={mods as any}
          // use default slide effect for better stability with videos
          loop={loopEnabled}
          rewind={slideCount > 1}
          autoplay={{ delay: Number(autoplayMs || 5000), disableOnInteraction: false }}
          navigation={slideCount > 1}
          pagination={slideCount > 1 ? ({ clickable: true } as any) : (false as any)}
          onBeforeInit={(swiper) => {
            if (paginationRef.current) {
              const params = swiper.params as any;
              params.pagination = params.pagination || {};
              params.pagination.el = paginationRef.current;
              params.pagination.clickable = true;
              params.pagination.renderBullet = (index: number, className: string) => (
                `<span class="${className} w-6 h-6 inline-flex items-center justify-center rounded-full bg-white/90 text-black text-xs mx-1">${index + 1}</span>`
              );
            }
          }}
          allowTouchMove={slideCount > 1}
          watchOverflow
          className="h-full w-full"
          key={slides.map((s) => s.image).join('|')}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              {(() => {
                const src = slide.image.toLowerCase();
                const video = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg');
                return video ? (
                  <div className="relative h-full w-full">
                    <video src={slide.image} className="h-full w-full object-cover" autoPlay muted loop playsInline />
                    <div className="absolute inset-0 bg-black/40 flex items-center pointer-events-none">
                      <div className="container mx-auto px-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                          {slide.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{slide.subtitle}</p>
                        <Link
                          href={slide.href}
                          className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 pointer-events-auto"
                        >
                          Ver más
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${slide.image}')` }}>
                    <div className="absolute inset-0 bg-black/40 flex items-center pointer-events-none">
                      <div className="container mx-auto px-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                          {slide.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{slide.subtitle}</p>
                        <Link
                          href={slide.href}
                          className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 pointer-events-auto"
                        >
                          Ver más
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </SwiperSlide>
          ))}
        </Swiper>
        {slideCount > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-auto">
            <div ref={paginationRef} className="px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm" />
          </div>
        )}
      ) : (
        (() => {
          const slide = slides[0];
          const src = (slide?.image || '').toLowerCase();
          const video = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg');
          return (
            <div className="relative h-full w-full">
              {video ? (
                <video src={slide.image} className="h-full w-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${slide.image}')` }} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center pointer-events-none">
                <div className="container mx-auto px-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{slide.subtitle}</p>
                  <Link
                    href={slide.href}
                    className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 pointer-events-auto"
                  >
                    Ver más
                  </Link>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </section>
  );
}
