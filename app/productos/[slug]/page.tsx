'use client';

import { notFound } from 'next/navigation';
import Price from '@/components/price';
import { ProductActions } from '@/components/product-actions';
import type { Product } from '@prisma/client';
import { getProductPageData } from '@/server/actions/products';
import { useState, useEffect, use, useRef } from 'react';
import RelatedProductsCarousel from '@/components/related-products-carousel';

function ProductImageGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(images[0] || 'https://via.placeholder.com/400');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  return (
    <div>
      <div className="overflow-hidden rounded-lg shadow-md mb-4 cursor-pointer" onClick={() => setLightboxImage(selectedImage)}>
        <div
          style={{ backgroundImage: `url(${selectedImage})` }}
          className="bg-gray-200 h-96 w-full bg-cover bg-center transform transition-transform duration-300 hover:scale-110"
        ></div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="overflow-hidden rounded-md cursor-pointer" onClick={() => setSelectedImage(image)}>
            <div
              style={{ backgroundImage: `url(${image})` }}
              className={`bg-gray-200 h-20 w-full bg-cover bg-center transform transition-transform duration-300 hover:scale-110 ${selectedImage === image ? 'border-2 border-brand' : ''}`}
            ></div>
          </div>
        ))}
      </div>

      {lightboxImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold">&times;</button>
          <img src={lightboxImage} alt="Product image" className="max-w-full max-h-full p-4" />
        </div>
      )}
    </div>
  );
}

const AnimatedTitle = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <h2
      ref={ref}
      className={`text-3xl font-bold text-center my-8 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </h2>
  );
};

export default function ProductoDetallePage({ params }: { params: { slug: string } }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { product, settings, relatedProducts } = await getProductPageData(resolvedParams.slug);
      if (!product) {
        notFound();
      }
      setProduct(product);
      setSettings(settings);
      setRelatedProducts(relatedProducts);
    }
    fetchData();
  }, [resolvedParams.slug]);

  if (!product || !settings) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <ProductImageGallery images={product.images} />

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="mb-4">
            <Price priceUSD={product.priceUSD} priceAllyUSD={product.priceAllyUSD} tasa={settings.tasaVES} moneda="USD" className="text-3xl font-bold text-gray-900" />
            <Price priceUSD={product.priceUSD} priceAllyUSD={product.priceAllyUSD} tasa={settings.tasaVES} moneda="VES" className="text-lg text-gray-600 block" />
          </div>
          <p className="text-gray-700 leading-relaxed mb-8">
            {product.description || 'Descripcion no disponible.'}
          </p>
          
          <ProductActions product={{
            ...product,
            priceUSD: product.priceUSD,
            priceAllyUSD: product.priceAllyUSD || null,
            avgCost: product.avgCost || null,
            lastCost: product.lastCost || null,
          }} />

        </div>
      </div>

      <div className="mt-16">
        <AnimatedTitle>Productos Relacionados</AnimatedTitle>
        <RelatedProductsCarousel products={relatedProducts} settings={settings} />
      </div>
    </div>
  );
}