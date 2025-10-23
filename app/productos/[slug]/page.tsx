'use client';

'use client';

import { notFound } from 'next/navigation';
import Price from '@/components/price';
import { ProductActions } from '@/components/product-actions';
import type { Product } from '@prisma/client';
import { getProductPageData } from '@/server/actions/products';
import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RelatedProductsCarousel from '@/components/related-products-carousel';
import Head from 'next/head';
import Breadcrumb from '@/components/breadcrumb'; // Importar Breadcrumb

// Componente para el JSON-LD del producto
function ProductJsonLd({ product, baseUrl }: { product: Product; baseUrl: string }) {
  const productUrl = `${baseUrl}/productos/${product.slug}`;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images[0] || `${baseUrl}/logo-default.svg`,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: (product as any).brand || 'Carpihogar',
    },
    offers: {
      '@type': 'Offer',
      price: product.priceUSD.toString(),
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
    },
  };

  return (
    <Head>
      <link rel="canonical" href={productUrl} />
      <meta property="og:type" content="product" />
      <meta property="og:site_name" content="Carpihogar.ai" />
      <meta property="og:url" content={productUrl} />
      <meta property="og:title" content={product.name} />
      {product.description && <meta property="og:description" content={product.description} />}
      <meta property="og:image" content={product.images[0] || `${baseUrl}/logo-default.svg`} />
      {/* Open Graph product extension */}
      <meta property="product:brand" content={(product as any).brand || 'Carpihogar'} />
      <meta property="product:availability" content={product.stock > 0 ? 'in stock' : 'out of stock'} />
      <meta property="product:retailer_item_id" content={product.sku || product.id} />
      {/* Open Graph price metadata for product */}
      <meta property="product:price:amount" content={product.priceUSD.toString()} />
      <meta property="product:price:currency" content="USD" />
      {/* Some crawlers also look for og:price:* */}
      <meta property="og:price:amount" content={product.priceUSD.toString()} />
      <meta property="og:price:currency" content="USD" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={product.name} />
      {product.description && <meta name="twitter:description" content={product.description} />}
      <meta name="twitter:image" content={product.images[0] || `${baseUrl}/logo-default.svg`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}


function ProductImageGallery({ images, videoUrl }: { images: string[]; videoUrl?: string | null }) {
  const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|ogg)(\?.*)?$/i.test(u);
  const media = [...(images || [])];
  if (videoUrl && !isVideo(images?.[images.length - 1])) {
    media.push(videoUrl);
  }
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const selectedUrl = media[selectedIdx] || 'https://via.placeholder.com/400';
  const selectedIsVideo = isVideo(selectedUrl) || (!!videoUrl && selectedIdx === media.length - 1 && selectedUrl === videoUrl);

  return (
    <div>
      <div className="overflow-hidden rounded-lg shadow-md mb-4 cursor-pointer" onClick={() => !selectedIsVideo && setLightboxImage(selectedUrl)}>
        {selectedIsVideo ? (
          <video controls className="w-full h-96 bg-black" src={selectedUrl} />
        ) : (
          <div
            style={{ backgroundImage: `url(${selectedUrl})` }}
            className="bg-gray-200 h-96 w-full bg-cover bg-center transform transition-transform duration-300 hover:scale-110"
          ></div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {media.map((url, index) => {
          const isV = isVideo(url) || (!!videoUrl && index === media.length - 1 && url === videoUrl);
          return (
            <div key={index} className="overflow-hidden rounded-md cursor-pointer" onClick={() => setSelectedIdx(index)}>
              <div
                style={!isV ? { backgroundImage: `url(${url})` } : undefined}
                className={`bg-gray-200 h-20 w-full bg-cover bg-center transform transition-transform duration-300 hover:scale-110 ${selectedIdx === index ? 'border-2 border-brand' : ''} relative`}
              >
                {isV && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-semibold">Video</div>
                )}
              </div>
            </div>
          );
        })}
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
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { product: p, settings, relatedProducts } = await getProductPageData(resolvedParams.slug);
      if (!p) {
        notFound();
      }
      // Redirect to canonical slug if different (e.g., entered without suffix)
      if (p && resolvedParams.slug !== p.slug) {
        router.replace(`/productos/${p.slug}`);
        return; // avoid setting stale state
      }
      setProduct(p);
      setSettings(settings);
      setRelatedProducts(relatedProducts);
    }
    fetchData();
  }, [resolvedParams.slug, router]);

  if (!product || !settings) {
    return <div>Cargando...</div>;
  }

  // Construir items para el Breadcrumb
  const breadcrumbItems = [
    { name: 'Inicio', href: '/' },
  ];
  if (product.category) {
    breadcrumbItems.push({ name: product.category.name, href: `/categorias/${product.category.slug}` });
  }
  breadcrumbItems.push({ name: product.name, href: `/productos/${product.slug}` });

  return (
    <>
      {product && <ProductJsonLd product={product} baseUrl="https://carpihogar.com" />}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} baseUrl="https://carpihogar.com" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <ProductImageGallery images={product.images} videoUrl={(product as any).videoUrl} />

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

            {/* Social buttons: show only if enabled at product and handles configured */}
            {Boolean((product as any).showSocialButtons) && (Boolean((settings as any).instagramHandle) || Boolean((settings as any).tiktokHandle)) && (
              <div className="mt-6 flex gap-3">
                {Boolean((settings as any).instagramHandle) && (
                  <a
                    className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700"
                    href={`https://www.instagram.com/${String((settings as any).instagramHandle || '').replace(/^@+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver en Instagram
                  </a>
                )}
                {Boolean((settings as any).tiktokHandle) && (
                  <a
                    className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
                    href={`https://www.tiktok.com/@${String((settings as any).tiktokHandle || '').replace(/^@+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver en TikTok
                  </a>
                )}
              </div>
            )}

          </div>
        </div>

        <div className="mt-16">
          <AnimatedTitle>Productos Relacionados</AnimatedTitle>
          <RelatedProductsCarousel products={relatedProducts} settings={settings} />
        </div>
      </div>
    </>
  );
}
