'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slideCount <= 1) return;
    const delay = Math.max(1000, Number(autoplayMs || 5000));
    const id = setInterval(() => setIndex((i) => (i + 1) % slideCount), delay);
    return () => clearInterval(id);
  }, [slideCount, autoplayMs]);

  useEffect(() => {
    setIndex(0);
  }, [slides.map((s) => s.image).join('|')]);

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

  const cur = slides[index];
  const isVideo = cur.image.toLowerCase().endsWith('.mp4') || cur.image.toLowerCase().endsWith('.webm') || cur.image.toLowerCase().endsWith('.ogg');
  const sectionStyle: CSSProperties | undefined = !isVideo
    ? { backgroundImage: `url('${cur.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <section className="relative h-[45vh] sm:h-[55vh] md:h-[70vh] lg:h-[80vh] min-h-[320px] w-full text-white bg-black" style={sectionStyle}>
      <div className="absolute inset-0">
        {isVideo ? (
          <video key={cur.image} src={cur.image} className="h-full w-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="absolute inset-0 bg-black/40 flex items-center">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-md max-w-3xl">
            {cur.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl mt-3 max-w-2xl">{cur.subtitle}</p>
          <Link href={cur.href} className="mt-6 sm:mt-8 inline-block bg-brand hover:opacity-90 font-semibold text-base sm:text-lg py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300">
            Ver más
          </Link>
        </div>
      </div>
      {slideCount > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center">
          <div className="px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-6 h-6 inline-flex items-center justify-center rounded-full mx-1 text-xs ${i === index ? 'bg-white text-black' : 'bg-white/60 text-black/80'}`}
                aria-label={`Slide ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

