import { redirect } from 'next/navigation';

export default async function PrintProductosPorProveedorCompras({
  searchParams,
}: {
  searchParams?: Promise<{ proveedor?: string; categoria?: string; q?: string }>
}) {
  const sp = (await searchParams) || ({} as any);
  const params = new URLSearchParams();
  if (sp.proveedor) params.set('proveedor', String(sp.proveedor));
  if (sp.categoria) params.set('categoria', String(sp.categoria));
  if (sp.q) params.set('q', String(sp.q));
  const qs = params.toString();
  redirect(`/dashboard/admin/inventario/productos-por-proveedor/print${qs ? '?' + qs : ''}`);
}

