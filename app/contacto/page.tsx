import { getSettings } from '@/server/actions/settings';
import Link from 'next/link';

export default async function ContactoPage() {
  const settings = await getSettings();

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuánto tarda el envío nacional?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "De 3 a 7 días."
        }
      },
      {
        "@type": "Question",
        "name": "¿Aceptan pagos en bolívares?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, se aceptan pagos en bolívares (Bs)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la garantía de los muebles?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La garantía es la que el fabricante otorga para cada pieza. Se aceptan devoluciones inmediatas hasta 2 días después de recibir el producto si presenta desperfectos de fábrica."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo convertirse en aliado (arquitecto/diseñador)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simplemente regístrate y marca la casilla de aliado o arquitecto, coloca tus datos y teléfono obligatorio en el perfil y te contactaremos. También puedes contactarnos vía WhatsApp."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo pagar en cuotas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Actualmente estamos implementando esta función."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué materiales usan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Para los muebles utilizamos materiales de primera calidad."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Contacto</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Estamos aqui para ayudarte. Elige tu metodo de contacto preferido.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Informacion de contacto</h2>
              <ul className="space-y-6">
                <li className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-3">Tel</div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Telefono</h3>
                    <a href={`tel:${settings.contactPhone}`} className="text-gray-600 hover:text-blue-600 transition-colors">
                      {settings.contactPhone}
                    </a>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="bg-green-100 text-green-600 rounded-full p-3">Mail</div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Email</h3>
                    <a href={`mailto:${settings.contactEmail}`} className="text-gray-600 hover:text-green-600 transition-colors">
                      {settings.contactEmail}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Preguntas rapidas</h2>
              <p className="text-gray-600 mb-6">Envianos un mensaje por WhatsApp para una respuesta inmediata.</p>
              <Link
                href={`https://wa.me/${settings.whatsappPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full md:w-auto"
              >
                Chatea por WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
