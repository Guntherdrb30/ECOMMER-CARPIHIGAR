'use client';

import { ContactForm } from './contact-form';
import { useState } from 'react';

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

export default function ContactoPage() {
  // Settings can be fetched here if needed for contact info, similar to the old page
  // For this template, we'll use placeholder data for some fields.

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
              Nos encantaría saber de ti. Ya sea una pregunta, un comentario o una propuesta de colaboración, estamos aquí para escucharte.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Column: Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Información de Contacto</h2>
                <p className="text-gray-600">
                  Puedes contactarnos a través de los siguientes canales o visitarnos en nuestra tienda.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Email</h3>
                    <a href="mailto:contacto@carpihogar.com" className="text-brand hover:underline">contacto@carpihogar.com</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Teléfono</h3>
                    <a href="tel:+582121234567" className="text-brand hover:underline">+58 (212) 123-4567</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Dirección</h3>
                    <p className="text-gray-600">Av. Principal, Edificio XYZ, Piso 1, Caracas, Venezuela</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="bg-gray-50 p-8 rounded-2xl shadow-inner">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Envíanos un mensaje</h2>
              <ContactForm />
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-gray-900 text-white text-center py-24">
          <h3 className="text-3xl font-bold">Aquí va nuestro mapa</h3>
          <p className="text-gray-400 mt-2">Una integración con Google Maps se verá genial en este espacio.</p>
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