import Link from 'next/link';
import { Divider, Button } from '@heroui/react';

type FooterProps = {
  brandName?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappPhone?: string;
};

export default function Footer({ brandName, contactEmail, contactPhone, whatsappPhone }: FooterProps) {
  const whatsappNumber = (whatsappPhone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '').replace(/\D+/g, '');
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '#';

  return (
    <footer className="text-white py-10 bg-[var(--color-secondary)]/95 backdrop-blur">
      <div className="container mx-auto px-4 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-2">{brandName || 'Carpihogar.ai'}</h3>
            <p className="text-gray-400">Tu tienda de confianza para el hogar.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Contacto</h3>
            <p className="text-gray-400">Email: {contactEmail || 'root@carpihogar.com'}</p>
            <p className="text-gray-400">Teléfono: {contactPhone || '+58 000-000-0000'}</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Envíos</h3>
            <p className="text-gray-400">Envíos a nivel nacional en Venezuela.</p>
            {whatsappNumber ? (
              <Button as="a" href={whatsappUrl} target="_blank" rel="noopener noreferrer" color="success" variant="solid" className="mt-4">
                Contáctanos por WhatsApp
              </Button>
            ) : null}
          </div>
        </div>
        <Divider className="my-8 bg-white/10" />
        <p className="text-sm text-gray-300">&copy; {new Date().getFullYear()} {brandName || 'Carpihogar.ai'}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

