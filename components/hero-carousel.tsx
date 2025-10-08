'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import Link from 'next/link';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  href: string;
}

type Props = {
  images?: string[];
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
      image: '/uploads/carpinteria y hogar.png',
      title: 'Diseño y Calidad para tus Espacios',
      subtitle: 'Encuentra los mejores acabados y herrajes para tus proyectos de carpintería.',
      href: '/productos?categoria=carpinteria',
    },
    {
      image: '/uploads/cocina moderna.png',
      title: 'Renueva tu Hogar con Estilo',
      subtitle: 'Descubre nuestra selección de productos para darle un nuevo aire a tu hogar.',
      href: '/productos?categoria=hogar',
    },
    {
      image: '/uploads/1.png',
      title: 'Herramientas para Profesionales',
      subtitle: 'Todo lo que necesitas para llevar tus proyectos al siguiente nivel.',
      href: '/productos?q=herramientas',
    },
  ];
}

export default function HeroCarousel({ images }: Props) {
  const slides = buildSlides(images);
  return (
    <section className="relative h-[45vh] sm:h-[55vh] md:h-[70vh] lg:h-[80vh] min-h-[320px] w-full text-white">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        effect="fade"
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        className="h-full w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/40 flex items-center">
                <div className="container mx-auto px-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.href}
                    className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300"
                  >
                    Ver más
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
