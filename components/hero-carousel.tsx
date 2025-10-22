'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type CSSProperties } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
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
  if (normalized.length) {
    return normalized.map((img, idx) => ({
      image: encodeURI(img),
      title: idx === 0 ? 'Descubre Carpihogar' : idx === 1 ? 'Renueva tu Hogar con Estilo' : 'Calidad y Diseño',
      subtitle: 'Encuentra los mejores productos para tus proyectos y tu hogar.',
      href: '/productos',
    }));
  }
  return [
    {
      image: encodeURI('/uploads/carpinteria y hogar.png'),
      title: 'Diseño y Calidad para tus Espacios',
      subtitle: 'Encuentra los mejores acabados y herrajes para tus proyectos de carpintería.',
      href: '/productos?categoria=carpinteria',
    },
    {
      image: encodeURI('/uploads/cocina moderna.png'),
      title: 'Renueva tu Hogar con Estilo',
      subtitle: 'Descubre nuestra selección de productos para darle un nuevo aire a tu hogar.',
      href: '/productos?categoria=hogar',
    },
    {
      image: encodeURI('/uploads/1.png'),
      title: 'Herramientas para Profesionales',
      subtitle: 'Todo lo que necesitas para llevar tus proyectos al siguiente nivel.',
      href: '/productos?q=herramientas',
    },
  ];
}

export default function HeroCarousel({ images, autoplayMs }: Props) {
  const slides = buildSlides(images);
  const slideCount = slides.length;
  const [mods, setMods] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    import('swiper/modules')
      .then(({ Navigation, Pagination, Autoplay, EffectFade }) => {
        if (mounted) setMods([Navigation, Pagination, Autoplay, EffectFade]);
      })
      .catch((e) => {
        console.error('[HeroCarousel] Failed to load Swiper modules', e);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const hasMods = mods.length > 0;
  const loopEnabled = slideCount > 1;
  const first = slides[0];
  const firstIsVideo = !!first && (first.image.toLowerCase().endsWith('.mp4') || first.image.toLowerCase().endsWith('.webm') || first.image.toLowerCase().endsWith('.ogg'));
  const sectionStyle = !firstIsVideo && first?.image ? ({ backgroundImage: `url('${first.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } as CSSProperties) : undefined;
  return (
    <section className="relative h-[45vh] sm:h-[55vh] md:h-[70vh] lg:h-[80vh] min-h-[320px] w-full text-white bg-black" style={sectionStyle}>
      {hasMods ? (
        <Swiper
          modules={mods as any}
          effect={slideCount > 1 ? 'fade' : (undefined as any)}
          loop={loopEnabled}
          autoplay={{ delay: Number(autoplayMs || 5000), disableOnInteraction: false }}
          navigation={loopEnabled}
          pagination={loopEnabled ? { clickable: true } : false as any}
          allowTouchMove={loopEnabled}
          watchOverflow
          className="h-full w-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              {(() => {
                const src = slide.image.toLowerCase();
                const video = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg');
                return video ? (
                  <div className="relative h-full w-full">
                    <video src={slide.image} className="h-full w-full object-cover" autoPlay muted loop playsInline />
                    <div className="absolute inset-0 bg-black/40 flex items-center">
                      <div className="container mx-auto px-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                          {slide.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{slide.subtitle}</p>
                        <Link
                          href={slide.href}
                          className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300"
                        >
                          Ver más
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${slide.image}')` }}>
                    <div className="absolute inset-0 bg-black/40 flex items-center">
                      <div className="container mx-auto px-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                          {slide.title}
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{slide.subtitle}</p>
                        <Link
                          href={slide.href}
                          className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300"
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
              <div className="absolute inset-0 bg-black/40 flex items-center">
                <div className="container mx-auto px-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{slide.subtitle}</p>
                  <Link
                    href={slide.href}
                    className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300"
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




