'use client';

import { useFormState } from 'react-dom';
import { sendContactMessage } from '@/server/actions/messaging';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { PendingButton } from '@/components/pending-button';

const initialState = {
  message: '',
  error: false,
};

export function ContactForm() {
  const [state, formAction] = useFormState(sendContactMessage, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast.error(state.message);
      } else {
        toast.success(state.message);
      }
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre completo</label>
        <div className="mt-1">
          <input
            type="text"
            name="name"
            id="name"
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
            placeholder="Tu nombre"
          />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico</label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
            placeholder="tu@email.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Asunto</label>
        <div className="mt-1">
          <input
            type="text"
            name="subject"
            id="subject"
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
            placeholder="¿En qué podemos ayudarte?"
          />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensaje</label>
        <div className="mt-1">
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand focus:ring-brand sm:text-sm"
            placeholder="Escribe tu mensaje aquí..."
          ></textarea>
        </div>
      </div>
      <div>
        <PendingButton className="w-full">Enviar Mensaje</PendingButton>
      </div>
    </form>
  );
}
