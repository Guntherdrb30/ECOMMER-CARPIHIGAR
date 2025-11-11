"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from './hooks/useAssistant';

export default function AssistantButton() {
  const { open, setOpen } = useAssistant();
  return (
    <AnimatePresence>
      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full bg-[#E62C1A] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Abrir asistente Carpihogar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75a9.74 9.74 0 01-4.216-.95l-3.79.998a.75.75 0 01-.91-.91l.998-3.79A9.74 9.74 0 012.25 12z" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

