'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useSession, signOut } from 'next-auth/react';
import { User, ShoppingCart, LogIn, LogOut, Home, Box, Star, Mail, Menu, X } from 'lucide-react';

type HeaderProps = {
  logoUrl?: string;
  brandName?: string;
};

export default function Header({ logoUrl, brandName }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/productos', label: 'Productos', icon: Box },
    { href: '/categorias', label: 'Categorías', icon: Star },
    { href: '/novedades', label: 'Novedades', icon: Star },
    { href: '/contacto', label: 'Contacto', icon: Mail },
  ];

  const authenticatedLinks = [
    { href: '/dashboard/cliente', label: 'Mi Perfil', icon: User },
    { href: '/carrito', label: 'Carrito', icon: ShoppingCart },
  ];

  const unauthenticatedLinks = [
    { href: '/auth/login', label: 'Ingresar', icon: LogIn },
    { href: '/carrito', label: 'Carrito', icon: ShoppingCart },
  ];

  const getLinks = () => {
    if (status === 'authenticated') {
      return [...navLinks, ...authenticatedLinks];
    }
    return [...navLinks, ...unauthenticatedLinks];
  };

  const allLinks = getLinks();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 md:py-5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3" aria-label={brandName || 'Inicio'}>
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={brandName || 'Logo'} className="h-10 md:h-12 w-auto object-contain" />
              <span className="hidden sm:inline text-xl md:text-2xl font-bold text-brand">
                {brandName || 'Carpihogar.ai'}
              </span>
            </>
          ) : (
            <span className="text-2xl md:text-3xl font-bold text-brand">{brandName || 'Carpihogar.ai'}</span>
          )}
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {allLinks.map((link) => (
            <Link key={link.href} href={link.href} className="relative text-gray-600 hover:text-brand transition-colors px-2 py-1">
              {link.label}
              {isClient && link.href === '/carrito' && totalItems > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          ))}
          {status === 'authenticated' && (
            <button onClick={() => signOut()} className="relative text-gray-600 hover:text-brand transition-colors px-2 py-1">
              Cerrar Sesión
            </button>
          )}
        </nav>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-brand focus:outline-none">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white px-4 pb-4">
          <nav className="flex flex-col space-y-4">
            {allLinks.map((link) => (
              <Link key={link.href} href={link.href} className="relative text-gray-600 hover:text-brand transition-colors py-2" onClick={() => setIsOpen(false)}>
                <span className="flex items-center">
                  <link.icon className="mr-2" size={20} />
                  {link.label}
                  {isClient && link.href === '/carrito' && totalItems > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </span>
              </Link>
            ))}
            {status === 'authenticated' && (
              <button onClick={() => { signOut(); setIsOpen(false); }} className="relative text-gray-600 hover:text-brand transition-colors py-2">
                <span className="flex items-center">
                  <LogOut className="mr-2" size={20} />
                  Cerrar Sesión
                </span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}