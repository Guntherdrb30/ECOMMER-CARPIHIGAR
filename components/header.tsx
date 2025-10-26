'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useSession, signOut } from 'next-auth/react';
import { User, ShoppingCart, LogIn, LogOut, Home, Box, Star, Mail, Menu, X } from 'lucide-react';
import ProductLiveSearch from '@/components/product-live-search';

type HeaderProps = {
  logoUrl?: string;
  brandName?: string;
};

export default function Header({ logoUrl, brandName }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartItems = useCartStore((s) => s.items);
  const cartTotalUSD = useCartStore((s) => s.getTotalUSD());
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!cartRef.current) return;
      if (!cartRef.current.contains(e.target as Node)) setCartOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
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
      <div className="container mx-auto px-4 py-4 md:py-5 flex justify-between items-center gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label={brandName || 'Inicio'}>
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={brandName || 'Logo'} className="h-10 lg:h-11 xl:h-12 w-auto object-contain" />
              <span className="hidden xl:inline text-2xl font-bold text-brand">
                {brandName || 'Carpihogar.ai'}
              </span>
            </>
          ) : (
            <span className="text-2xl md:text-3xl font-bold text-brand">{brandName || 'Carpihogar.ai'}</span>
          )}
        </Link>
        {/* Search bar visible on md+ */}
        <div className="hidden md:block flex-1 max-w-xl mx-2">
          <ProductLiveSearch placeholder="Buscar productos..." />
        </div>
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 ml-auto">
          {allLinks.filter(l => l.href !== '/carrito').map((link) => (
            <Link key={link.href} href={link.href} className="relative text-gray-600 hover:text-brand transition-colors px-2 py-1 whitespace-nowrap text-sm xl:text-base">
              {link.label}
              {isClient && link.href === '/carrito' && totalItems > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          ))}
          <div className="relative" ref={cartRef}>
            <button onClick={() => setCartOpen(v => !v)} className="relative text-gray-600 hover:text-brand transition-colors px-2 py-1 text-sm xl:text-base">
              Carrito
              {isClient && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{totalItems}</span>
              )}
            </button>
            {cartOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
                <div className="p-3 border-b font-semibold">Tu Carrito</div>
                <div className="max-h-64 overflow-auto divide-y">
                  {cartItems.length === 0 ? (
                    <div className="p-3 text-sm text-gray-600">{"A\u00fan no has agregado productos."}</div>
                  ) : (
                    cartItems.slice(0,4).map((it) => (
                      <div key={it.id} className="p-3 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0"><div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-none">{it.image ? <img src={it.image} className="w-full h-full object-cover" /> : null}</div><div className="truncate">{it.name}</div></div>
                        <div className="ml-2 text-gray-700 whitespace-nowrap">x{it.quantity}</div><div className="ml-2 text-gray-700 whitespace-nowrap">${(it.priceUSD * it.quantity).toFixed(2)}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t text-sm flex items-center justify-between">
                  <span>Total aprox.</span>
                  <span className="font-semibold">${cartTotalUSD.toFixed(2)}</span>
                </div>
                <div className="p-3 pt-0 flex gap-2">
                  <a href="/carrito" className="flex-1 text-center border rounded py-1" onClick={() => setCartOpen(false)}>Ver Carrito</a>
                  <a href="/checkout/revisar" className="flex-1 text-center bg-brand text-white rounded py-1" onClick={() => setCartOpen(false)}>Pagar</a>
                </div>
              </div>
            )}
          </div>
          {status === 'authenticated' && (
            <button onClick={() => signOut()} className="relative text-gray-600 hover:text-brand transition-colors px-2 py-1">
              Cerrar Sesión
            </button>
          )}
        </nav>
        <div className="md:hidden ml-auto flex items-center gap-4">
          <Link href="/carrito" className="relative text-gray-600 hover:text-brand focus:outline-none" aria-label="Carrito">
            <ShoppingCart size={22} />
            {isClient && totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] leading-none rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-brand focus:outline-none" aria-label="Abrir menú">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white px-4 pb-4">
          <div className="py-3">
            <ProductLiveSearch placeholder="Buscar productos..." />
          </div>
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






