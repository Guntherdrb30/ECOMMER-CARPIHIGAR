"use client";

import { useState } from 'react';

export default function DashboardShell({
  sidebar,
  children,
  title,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleSidebarClick = (e: React.MouseEvent<HTMLDivEleMenu>) => {
    try {
      const target = e.target as HTMLEleMenu | null;
      const link = target?.closest('a');
      if (link) {
        setOpen(false);
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Topbar (mobile) */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b px-3 py-2 flex items-center justify-between">
        <button
          aria-label="Abrir Menuº"
          className="p-2 rounded border text-gray-700"
          onClick={() => setOpen(true)}
        >
          {/* Hamburger icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="text-sm font-semibold text-gray-800">{title || 'Panel'}</div>
        <div className="w-9" />
      </div>

      {/* Layout */}
      <div className="flex">
        {/* Sidebar desktop */}
        <div className="hidden md:block">
          {sidebar}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-white shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="text-sm font-semibold">Menuº</div>
              <button className="p-2 rounded border text-gray-700" onClick={() => setOpen(false)} aria-label="Cerrar menuº">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="overflow-auto h-[calc(100vh-44px)]" onClick={handleSidebarClick}>
              {sidebar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
