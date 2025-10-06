'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import Link from 'next/link';

interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  href: string;
}

const slides: HeroSlide[] = [
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

export default function HeroCarousel() {
  return (
    <section className="relative h-[70vh] md:h-[90vh] w-full text-white">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        effect="fade"
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
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
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center">
                <div className="container mx-auto px-4">
                  <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-md max-w-3xl">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-2xl mt-3 max-w-2xl">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.href}
                    className="mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-lg py-3 px-8 rounded-full transition-all duration-300"
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
