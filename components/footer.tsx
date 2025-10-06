import Link from 'next/link';

export default function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <footer className="text-white py-8" style={{ backgroundColor: 'var(--color-secondary)' }}>
      <div className="container mx-auto px-4 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-2">Carpihogar.ai</h3>
            <p className="text-gray-400">Tu tienda de confianza para el hogar.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Contacto</h3>
            <p className="text-gray-400">Email: contacto@carpihogar.ai</p>
            <p className="text-gray-400">Teléfono: +58 212-555-1234</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Envíos</h3>
            <p className="text-gray-400">Envíos a nivel nacional en Venezuela.</p>
            {whatsappNumber && (
              <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors">
                Contáctanos por WhatsApp
              </Link>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4">
          <p>&copy; {new Date().getFullYear()} Carpihogar.ai. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
