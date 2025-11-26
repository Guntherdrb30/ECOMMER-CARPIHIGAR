'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  images?: string[];
  autoplayMs?: number;
};

export default function HeroEcpdCarousel({ images, autoplayMs }: Props) {
  const slides = (images || []).filter(Boolean).map((img) => encodeURI(img));
  const count = slides.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const delay = Math.max(1500, Number(autoplayMs || 5000));
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, delay);
    return () => clearInterval(id);
  }, [count, autoplayMs]);

  useEffect(() => {
    setIndex(0);
  }, [slides.join('|')]);

  const current = slides[index];

  return (
    <section className="py-8 bg-neutral-900 text-white">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-300 mb-2">
            ECPD · PERSONALIZAR MUEBLES
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
            Diseña tu mueble a medida
          </h2>
          <p className="text-sm md:text-base text-gray-200 max-w-xl">
            Ajusta ancho, alto, fondo, cajones, baldas y acabados en tiempo real, con precio
            dinámico listo para producción.
          </p>
          <Link
            href="/personalizar-muebles"
            className="mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-brand text-white font-semibold hover:bg-opacity-90 transition-colors text-sm md:text-base"
          >
            Abrir personalizador de muebles
          </Link>
        </div>
        <div className="flex-1 w-full md:w-auto">
          <div className="relative w-full max-w-md mx-auto">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-800">
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current}
                  alt="Personalizador de muebles Carpihogar"
                  className="w-full h-48 md:h-56 object-cover"
                />
              ) : (
                <div className="w-full h-48 md:h-56 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] flex items-center justify-center text-xs md:text-sm text-gray-200">
                  Configura imágenes del mini hero del personalizador en
                  <span className="ml-1 font-semibold">Ajustes ▸ Home</span>.
                </div>
              )}
            </div>
            {count > 1 && (
              <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[10px] md:text-xs">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`w-2 h-2 rounded-full ${
                        i === index ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Ir a imagen ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

