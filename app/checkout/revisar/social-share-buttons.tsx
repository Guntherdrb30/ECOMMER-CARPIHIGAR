'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation'; 
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function SocialShareButtons({ productName }: { productName: string }) {
  const pathname = usePathname();
  const [productUrl, setProductUrl] = useState('');

  useEffect(() => {
    setProductUrl(window.location.href);
  }, [pathname]);

  if (!productUrl) {
    return null;
  }

  const shareText = `¡Mira este producto: ${productName}! ${productUrl}`;

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
  const instagramShareUrl = `https://www.instagram.com/`; // Instagram no tiene una URL directa para compartir enlaces en posts. Esto abre el perfil.
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const tiktokShareUrl = `https://www.tiktok.com/`; // TikTok tampoco tiene una URL directa para compartir enlaces.
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mt-8">
      <p className="text-sm text-gray-600 mb-2">Compartir en:</p>
      <div className="flex flex-wrap items-center gap-4">
        <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook" className="text-gray-500 hover:text-blue-600">
          <FaFacebook className="h-5 w-5 md:h-6 md:w-6" />
        </a>
        <a href={instagramShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Compartir en Instagram" className="text-gray-500 hover:text-gray-800">
          <FaInstagram className="h-5 w-5 md:h-6 md:w-6" />
        </a>
        <a href={xShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Compartir en X" className="text-gray-500 hover:text-gray-800">
          <FaXTwitter className="h-5 w-5 md:h-6 md:w-6" />
        </a>
        <a href={tiktokShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Compartir en TikTok" className="text-gray-500 hover:text-gray-800">
          <FaTiktok className="h-5 w-5 md:h-6 md:w-6" />
        </a>
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-green-600"
        >
          <FaWhatsapp className="h-5 w-5" /> 
          <span className="hidden sm:inline">Enviar por </span>WhatsApp
        </a>
      </div>
    </div>
  );
}