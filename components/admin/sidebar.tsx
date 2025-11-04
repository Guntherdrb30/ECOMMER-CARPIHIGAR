'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const email = String((session?.user as any)?.email || '').toLowerCase();
  const role = String((session?.user as any)?.role || '');
  const rootEmail = String(process.env.NEXT_PUBLIC_ROOT_EMAIL || process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const isRoot = role === 'ADMIN' && email === rootEmail;
  const [allyPending, setAllyPending] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    fetch('/api/admin/ally-pending-count')
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => {
        if (active && typeof d?.count === 'number') setAllyPending(d.count);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const links = [
    { href: '/dashboard/admin', label: 'Resumen' },
    { href: '/dashboard/admin/productos', label: 'Productos' },
    { href: '/dashboard/admin/categorias', label: 'Categorías' },
    { href: '/dashboard/admin/ventas', label: 'Ventas' },
    { href: '/dashboard/admin/ventas/aliados', label: 'Ventas Aliados (verificar)' },
    { href: '/dashboard/admin/delivery/solicitudes', label: 'Delivery (verificar)' },
    { href: '/dashboard/admin/delivery/liquidaciones', label: 'Liquidaciones Delivery' },
    { href: '/dashboard/admin/cuentas-por-cobrar', label: 'Cuentas por Cobrar' },
    { href: '/dashboard/admin/inventario', label: 'Inventario' },
    { href: '/dashboard/admin/inventario/valuacion', label: 'Valuación' },
    { href: '/dashboard/admin/inventario/valuacion/por-proveedor', label: 'Val. por Proveedor' },
    { href: '/dashboard/admin/inventario/productos-por-proveedor', label: 'Prod. por Proveedor' },
    { href: '/dashboard/admin/ventas/nueva', label: 'Nueva Venta' },
    { href: '/dashboard/admin/presupuestos', label: 'Presupuestos' },
    { href: '/dashboard/admin/compras', label: 'Compras' },
    { href: '/dashboard/admin/proveedores', label: 'Proveedores' },
    { href: '/dashboard/admin/usuarios', label: 'Usuarios' },
    { href: '/dashboard/admin/envios', label: 'Envíos' },
    { href: '/dashboard/admin/envios/online', label: 'Envíos Online' },
    { href: '/dashboard/admin/envios/tienda', label: 'Envíos en Tienda' },
    { href: '/dashboard/admin/ajustes', label: 'Ajustes' },
    { href: '/dashboard/admin/envios/logs', label: 'Logs de Envios' },
    ...(isRoot ? [{ href: '/dashboard/admin/ajustes/sistema', label: 'Ajustes del Sistema (Root)' }] : []),
    { href: '/dashboard/admin/reportes', label: 'Reportes' },
    { href: '/dashboard/admin/mensajeria', label: 'Mensajería' },
  ];

  return (
    <aside className="w-64 shrink-0 border-r bg-white min-h-[calc(100vh-64px)] print:hidden">
      <nav className="p-4 space-y-1">
        {links.map((l) => {
          const active = pathname === l.href || pathname?.startsWith(l.href + '/');
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span>{l.label}</span>
                {l.href === '/dashboard/admin/ventas/aliados' && allyPending > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] px-1.5 min-w-[1.25rem]">
                    {allyPending}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
        <hr className="my-3" />
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full text-left block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Cerrar Sesión
        </button>
      </nav>
    </aside>
  );
}










