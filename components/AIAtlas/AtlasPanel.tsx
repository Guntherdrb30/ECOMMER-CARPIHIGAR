"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from './hooks/useAssistant';
import ChatWindow from './ChatWindow';
import Toolbar from './Toolbar';
import './styles.css';

export default function AtlasPanel() {
  const { open, setOpen } = useAssistant();
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          className="fixed inset-y-0 right-0 z-[9999] w-full md:w-[70%] lg:w-[420px] bg-white aiatlas-shadow rounded-none md:rounded-l-xl flex flex-col"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Carpihogar" className="w-6 h-6 rounded" />
              <div className="font-semibold text-gray-900">Carpihogar AI</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-gray-100" aria-label="Cerrar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className="flex-1 min-h-0">
            <ChatWindow />
          </div>
          <div className="border-t">
            <Toolbar />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

