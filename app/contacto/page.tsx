'use client';

import { useState } from 'react';
import Image from 'next/image';

// Simple Accordion Component for FAQs
const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? '-rotate-180' : ''}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}>
        <p className="text-gray-600 pl-2">
          {answer}
        </p>
      </div>
    </div>
  );
};

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.289.173-1.413z"/>
    </svg>
);

export default function ContactoPage() {

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
        key="faq-jsonld"
      />
      <div className="bg-white">
        {/* Header Section */}
        <div className="text-center py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Hablemos</h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Nos encantaría saber de ti. Conéctate con nosotros a través de WhatsApp para una atención rápida y personalizada.
            </p>
          </div>
        </div>

        {/* WhatsApp Contact Section */}
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Atención Inmediata por WhatsApp</h2>
                    <p className="text-gray-600 mb-6">
                        ¿Tienes preguntas sobre nuestros productos, tu pedido o simplemente quieres saludar? Nuestro equipo está listo para ayudarte. Haz clic en el botón para iniciar una conversación.
                    </p>
                    <a 
                        href="https://wa.me/582121234567" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105"
                    >
                        <WhatsAppIcon />
                        <span className="ml-3">Chatea con nosotros</span>
                    </a>
                    <p className="mt-4 text-sm text-gray-500">Nuestro horario de atención es de 9:00 a.m. a 6:00 p.m.</p>
                </div>
                <div className="order-1 md:order-2 flex justify-center">
                    <Image 
                        src="/images/hero-carpinteria-1.svg"
                        alt="Contacto Carpihogar"
                        width={500}
                        height={500}
                        className="rounded-lg"
                    />
                </div>
            </div>
        </div>

        {/* Architects and Designers Section */}
        <div className="bg-gray-100">
            <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="flex justify-center">
                         <Image 
                            src="/images/hero-carpinteria-2.svg"
                            alt="Alianza Carpihogar"
                            width={500}
                            height={500}
                            className="rounded-lg"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Únete a Nuestra Red de Aliados</h2>
                        <p className="text-gray-600 mb-6">
                            ¿Eres arquitecto, diseñador de interiores o profesional de la construcción? Nos encantaría colaborar contigo. Ofrecemos beneficios exclusivos y una amplia gama de productos para tus proyectos.
                        </p>
                        <a 
                            href="https://wa.me/582121234567?text=Hola,%20estoy%20interesado%20en%20ser%20un%20aliado%20de%20Carpihogar."
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white font-bold rounded-full shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105"
                        >
                            <WhatsAppIcon />
                            <span className="ml-3">Contactar para ser Aliado</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Preguntas Frecuentes</h2>
            <p className="mt-4 text-lg text-gray-600">Encuentra respuestas rápidas a las dudas más comunes.</p>
          </div>
          <div className="space-y-4">
            {faqData.mainEntity.map((faq, index) => (
              <AccordionItem key={index} question={faq.name} answer={faq.acceptedAnswer.text} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
