'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard/admin', label: 'Resumen' },
  { href: '/dashboard/admin/productos', label: 'Productos' },
  { href: '/dashboard/admin/categorias', label: 'Categorías' },
  { href: '/dashboard/admin/ventas', label: 'Ventas' },
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
  { href: '/dashboard/admin/reportes', label: 'Reportes' },
  { href: '/dashboard/admin/mensajeria', label: 'Mensajería' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

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
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
