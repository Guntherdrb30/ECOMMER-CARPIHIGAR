'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import type { Product } from '@prisma/client';
import { toast } from 'sonner';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
} from 'react-share';

export function ProductActions({ product }: { product: Omit<Product, 'priceUSD'> & { priceUSD: number } }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        priceUSD: product.priceUSD,
      },
      quantity
    );
    toast.success('Producto agregado');
  };

  const shareUrl = `${process.env.NEXTAUTH_URL}/productos/${product.slug}`;

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <label htmlFor="quantity" className="font-bold">Cantidad:</label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border-gray-300 rounded-md shadow-sm focus:ring-brand focus:border-brand"
          disabled={product.stock === 0}
        >
          {Array.from({ length: Math.min(10, product.stock) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAddToCart}
        className="w-full bg-brand hover:bg-opacity-90 text-white font-bold text-lg py-3 px-8 rounded-full transition-colors disabled:bg-gray-400"
        disabled={product.stock === 0}
      >
        {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
      </button>
      <div className="mt-8">
        <p className="text-center text-sm font-medium text-gray-600 mb-4">
          ¡Comparte este producto con tus amigos!
        </p>
        <div className="flex justify-center gap-4">
          <FacebookShareButton url={shareUrl} title={product.name}>
            <FacebookIcon size={42} round />
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} title={product.name}>
            <TwitterIcon size={42} round />
          </TwitterShareButton>
          <WhatsappShareButton url={shareUrl} title={product.name} separator=":: ">
            <WhatsappIcon size={42} round />
          </WhatsappShareButton>
          <TelegramShareButton url={shareUrl} title={product.name}>
            <TelegramIcon size={42} round />
          </TelegramShareButton>
        </div>
      </div>
    </>
  );
}
