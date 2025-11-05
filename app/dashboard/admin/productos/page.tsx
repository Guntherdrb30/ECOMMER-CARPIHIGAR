import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProducts, createProduct } from "@/server/actions/products";
import ProductCsvUploader from '@/components/admin/product-csv-uploader';
import { getCategoriesFlattened } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getSettings } from "@/server/actions/settings";
import StockHistory from "@/components/admin/stock-history";
import ProductMediaManager from "@/components/admin/product-media-manager";
import { redirect } from "next/navigation";
import ProductQuickSearch from "@/components/admin/product-quick-search";
import ProductActionsMenu from "@/components/admin/product-actions-menu";
import { PendingButton } from '@/components/pending-button';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import RelatedProductsPicker from "@/components/admin/related-products-picker";

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<{ q?: string; categoria?: string; proveedor?: string; message?: string; error?: string }> }) {
  const session = await getServerSession(authOptions as any);
  const email = String((session?.user as any)?.email || '').toLowerCase();
  const role = String((session?.user as any)?.role || '');
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase();
  const isRoot = role === 'ADMIN' && email === rootEmail;

  const sp = (await searchParams) || ({} as any);
  const q = sp.q || '';
  const categoria = sp.categoria || '';
  const proveedor = (sp as any).proveedor || '';
  const message = (sp as any).message || '';

  const [products, categories, settings, suppliers] = await Promise.all([
    getProducts({ categorySlug: categoria || undefined, q: q || undefined, supplierId: proveedor || undefined }),
    getCategoriesFlattened(),
    getSettings(),
    getSuppliers(),
  ]);
  const lowStock = (settings as any).lowStockThreshold ?? 5;

  return (
    <div className="container mx-auto p-4">
      <ShowToastFromSearch successParam="message" errorParam="error" />
      <h1 className="text-2xl font-bold mb-4">Gestionar Productos</h1>
      {/* Buscador superior */}
      <form className="mb-3 flex gap-2" method="get">
        <input name="q" placeholder="Buscar por nombre, SKU o codigo" defaultValue={q} className="flex-1 border rounded px-2 py-1" />
        <button className="px-3 py-1 rounded bg-brand hover:bg-opacity-90 text-white">Buscar</button>
        {q && (<a href="/dashboard/admin/productos" className="px-3 py-1 rounded border">Limpiar</a>)}
      </form>

      <div className="mb-2 flex items-center gap-3 text-sm">
        <a href="/samples/products_template.csv" className="text-blue-600 underline" download>Descargar plantilla CSV de productos</a>
        <a href="/api/reports/products-csv" className="text-blue-600 underline" target="_blank">Exportar productos (CSV)</a>
      </div>
      <details className="mb-4 p-4 bg-white rounded shadow">
        <summary className="text-lg font-semibold cursor-pointer">Carga masiva (CSV) con previsualizacion</summary>
        <div className="mt-2">
          <p className="text-sm text-gray-600 mb-2">Columnas: <code>name</code>, <code>slug</code>, <code>sku</code>, <code>barcode</code>, <code>brand</code>, <code>priceUSD</code>, <code>priceAllyUSD</code>, <code>stock</code>, <code>categoryId</code>, <code>supplierId</code>, <code>image</code>, <code>images</code>. Puedes omitir precios y solo indicar costo; si no indicas precios, se calculan con los margenes por defecto.</p>
          <ProductCsvUploader />
        </div>
      </details>
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-1">Busqueda rapida</label>
        <ProductQuickSearch />
      </div>
      {message && (
        <div className="mb-4 border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">
          {message}
        </div>
      )}

      {/* Filtros */}
      <form className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-5 gap-3 mb-4" method="get">
        <input name="q" placeholder="Buscar por nombre" defaultValue={q} className="border rounded px-2 py-1" />
        <select name="categoria" defaultValue={categoria} className="border rounded px-2 py-1">
          <option value="">Todas las categorias</option>
          {(categories as any[]).map((c: any) => (
            <option key={c.id} value={c.slug}>{`${'- '.repeat(c.depth || 0)}${c.name}`}</option>
          ))}
        </select>
        <select name="proveedor" defaultValue={proveedor} className="border rounded px-2 py-1">
          <option value="">Todos los proveedores</option>
          {suppliers.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Filtrar</button>
        <a href="/dashboard/admin/productos" className="px-3 py-1 rounded border text-gray-700">Limpiar</a>
      </form>

      {/* Crear producto */}
      <details className="form-card">
        <summary className="text-lg font-bold cursor-pointer">Crear Producto</summary>
        <form className="mt-3" action={async (formData) => {
          'use server';
          const images = (formData.getAll('images[]') as string[]).filter(Boolean);
          const mainImageUpload = String(formData.get('mainImage') || '').trim();
          const mainImage = String(formData.get('image') || '').trim() || mainImageUpload;
          if (mainImage) images.unshift(mainImage);
          const limited = images.slice(0, 4);
          const relatedIds = (formData.getAll('relatedIds[]') as string[]).map(String).filter(Boolean);
          await createProduct({
            name: String(formData.get('name') || ''),
            slug: String(formData.get('slug') || ''),
            brand: String(formData.get('brand') || ''),
            description: String(formData.get('description') || ''),
            images: limited,
            sku: String(formData.get('sku') || '') || null,
            barcode: String(formData.get('barcode') || ''),
            priceUSD: parseFloat(String(formData.get('priceUSD') || '0')),
            priceAllyUSD: formData.get('priceAllyUSD') ? parseFloat(String(formData.get('priceAllyUSD'))) : null,
            stock: parseInt(String(formData.get('stock') || '0'), 10),
            categoryId: String(formData.get('categoryId') || '' ) || null,
            supplierId: String(formData.get('supplierId') || '' ) || null,
            isNew: Boolean(formData.get('isNew')),
            videoUrl: String((formData.get('videoUrl') as string) || '').trim() || null,
            showSocialButtons: Boolean(formData.get('showSocialButtons')),
            relatedIds,
          });
          redirect('/dashboard/admin/productos?message=Producto%20creado');
        }} className="form-grid">
          <input name="name" placeholder="Nombre" className="form-input" required />
          <input name="slug" placeholder="slug-ejemplo" className="form-input" required />
          <input name="sku" placeholder="SKU (opcional)" className="form-input" />
          <input name="barcode" placeholder="Codigo de barras (opcional)" className="form-input" />
          <input name="brand" placeholder="Marca" className="form-input" required />
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-700 mb-1">Descripcion</label>
            <textarea name="description" placeholder="Descripcion del producto" className="w-full border rounded px-2 py-1 min-h-[80px]"></textarea>
          </div>
          <input name="priceUSD" type="number" step="0.01" placeholder="Precio USD" className="form-input" required />
          <input name="priceAllyUSD" type="number" step="0.01" placeholder="Precio Aliado USD (opcional)" className="form-input" />
          <input name="stock" type="number" min="0" placeholder="Stock" className="form-input" required />
          <input name="videoUrl" placeholder="URL de video (opcional)" className="form-input" />
          <select name="categoryId" className="form-select">
            <option value="">Sin categoria</option>
            {(categories as any[]).map((c: any) => (
              <option key={c.id} value={c.id}>{`${'- '.repeat(c.depth || 0)}${c.name}`}</option>
            ))}
          </select>
          <select name="supplierId" className="form-select">
            <option value="">Sin proveedor</option>
            {suppliers.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="md:col-span-3">
            <RelatedProductsPicker products={products as any} name="relatedIds[]" watchCategoryName="categoryId" />
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="showSocialButtons" /> Mostrar botones Instagram/TikTok en el producto</label>
            </div>
          </div>
          <ProductMediaManager />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="isNew" /> Nuevo</label>
          <div className="md:col-span-3">
            <div className="form-actions">
              <PendingButton className="bg-green-600 text-white px-3 py-1 rounded" pendingText="Creando...">Crear</PendingButton>
            </div>
          </div>
        </form>
      </details>

      {/* Lista compacta con acordeón */}
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h2 className="text-lg font-bold mb-2">Todos los Productos</h2>
        <details className="rounded border border-gray-200" open>
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700">Ver productos</summary>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-2 py-1 text-left w-64">Nombre</th>
                  <th className="px-2 py-1 text-left w-48">Slug</th>
                  <th className="px-2 py-1 text-left w-24">Precio USD</th>
                  <th className="px-2 py-1 text-left w-28">Precio Aliado</th>
                  <th className="px-2 py-1 text-left w-20">Stock</th>
                  <th className="px-2 py-1 text-left w-40">Categoria</th>
                  <th className="px-2 py-1 text-left w-40">Proveedor</th>
                  <th className="px-2 py-1 text-left w-16">Nuevo</th>
                  <th className="px-2 py-1 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any) => (
                  <tr key={product.id} className="border-t">
                    <td className="px-2 py-1 align-top">{product.name}</td>
                    <td className="px-2 py-1 align-top">{product.slug}</td>
                    <td className="px-2 py-1 align-top">{Number(product.priceUSD).toFixed ? Number(product.priceUSD).toFixed(2) : String(product.priceUSD)}</td>
                    <td className="px-2 py-1 align-top">{product.priceAllyUSD != null ? (Number(product.priceAllyUSD).toFixed ? Number(product.priceAllyUSD).toFixed(2) : String(product.priceAllyUSD)) : ''}</td>
                    <td className={`px-2 py-1 align-top ${product.stock <= lowStock ? 'bg-red-50 text-red-700 font-semibold' : ''}`}>{product.stock}</td>
                    <td className="px-2 py-1 align-top">{product.category?.name}</td>
                    <td className="px-2 py-1 align-top">{product.supplier?.name || '-'}</td>
                    <td className="px-2 py-1 align-top">{product.isNew ? 'Si' : 'No'}</td>
                    <td className="px-2 py-1 align-top space-y-2">
                      <ProductActionsMenu product={product} lowStock={lowStock} isRoot={isRoot} />
                      <StockHistory productId={product.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
