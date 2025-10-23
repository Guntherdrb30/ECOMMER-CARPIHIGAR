import { getProducts, createProduct, deleteProductByForm, updateProductInline, createStockMovement, updateProductBarcodeByForm } from "@/server/actions/products";
import ProductCsvUploader from '@/components/admin/product-csv-uploader';
import SecretDeleteButton from "@/components/admin/secret-delete-button";
import { getCategoriesFlattened } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getSettings } from "@/server/actions/settings";
import StockHistory from "@/components/admin/stock-history";
import ProductMediaManager from "@/components/admin/product-media-manager";
import { redirect } from "next/navigation";
import ProductQuickSearch from "@/components/admin/product-quick-search";
import { PendingButton } from '@/components/pending-button';
import ShowToastFromSearch from '@/components/show-toast-from-search';
import RelatedProductsPicker from "@/components/admin/related-products-picker";

export default async function AdminProductsPage({ searchParams }: { searchParams?: Promise<{ q?: string; categoria?: string; proveedor?: string; message?: string }> }) {
  const sp = (await searchParams) || {} as any;
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
      <div className="mb-2 flex items-center gap-3 text-sm">
        <a href="/samples/products_template.csv" className="text-blue-600 underline" download>Descargar plantilla CSV de productos</a>
        <a href="/api/reports/products-csv" className="text-blue-600 underline" target="_blank">Exportar productos (CSV)</a>
      </div>
      <div className="mb-4 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Carga masiva (CSV) con previsualizacion</h2>
        <p className="text-sm text-gray-600 mb-2">Columnas alineadas con el formulario: <code>name</code>, <code>slug</code>, <code>sku</code>, <code>barcode</code>, <code>brand</code>, <code>priceUSD</code>, <code>priceAllyUSD</code>, <code>stock</code>, <code>categoryId</code>, <code>supplierId</code>, <code>image</code>, <code>images</code>. Puedes omitir precios y solo indicar costo; si no indicas precios, se calculan con los margenes por defecto del sistema.</p>
        <ProductCsvUploader />
      </div>
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
      <div className="form-card">
        <h2 className="text-lg font-bold">Crear Producto</h2>
        <form action={async (formData) => {
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
          <input name="stock" type="number" placeholder="Stock" className="form-input" defaultValue={0} />
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
      </div>

      {/* Lista */}
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h2 className="text-lg font-bold mb-2">Todos los Productos</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Precio USD</th>
                <th className="px-4 py-2">Precio Aliado USD</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Proveedor</th>
                <th className="px-4 py-2">Nuevo</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => (
                <tr key={product.id}>
                  <td className="border px-4 py-2">{product.name}</td>
                  <td className="border px-4 py-2">{product.slug}</td>
                  <td className="border px-4 py-2">{Number(product.priceUSD).toFixed ? Number(product.priceUSD).toFixed(2) : String(product.priceUSD)}</td>
                  <td className="border px-4 py-2">{product.priceAllyUSD != null ? (Number(product.priceAllyUSD).toFixed ? Number(product.priceAllyUSD).toFixed(2) : String(product.priceAllyUSD)) : ''}</td>
                  <td className={`border px-4 py-2 ${product.stock <= lowStock ? 'bg-red-50 text-red-700 font-semibold' : ''}`}>{product.stock}</td>
                  <td className="border px-4 py-2">{product.category?.name}</td>
                  <td className="border px-4 py-2">{product.supplier?.name || '-'}</td>
                  <td className="border px-4 py-2">{product.isNew ? 'Si' : 'No'}</td>
                  <td className="border px-4 py-2 space-y-2">
                    <form action={updateProductInline} className="flex flex-wrap gap-2 items-center text-sm">
                      <input type="hidden" name="id" value={product.id} />
                      <input name="priceUSD" type="number" step="0.01" defaultValue={Number(product.priceUSD)} className="w-24 border rounded px-1 py-0.5" />
                      <input name="priceAllyUSD" type="number" step="0.01" defaultValue={product.priceAllyUSD != null ? Number(product.priceAllyUSD) : undefined} className="w-24 border rounded px-1 py-0.5" />
                      <input name="stock" type="number" defaultValue={product.stock} className="w-20 border rounded px-1 py-0.5" />
                      <label className="inline-flex items-center gap-1"><input type="checkbox" name="isNew" defaultChecked={product.isNew} /> Nuevo</label>
                      <input name="image" placeholder="URL img" className="w-40 border rounded px-1 py-0.5" />
                      <PendingButton className="px-2 py-1 bg-gray-800 text-white rounded" pendingText="Guardando...">Guardar</PendingButton>
                    </form>
                    <form action={createStockMovement} className="flex flex-wrap gap-2 items-center text-sm">
                      <input type="hidden" name="productId" value={product.id} />
                      <select name="type" className="border rounded px-1 py-0.5">
                        <option value="ENTRADA">Entrada</option>
                        <option value="SALIDA">Salida</option>
                        <option value="AJUSTE">Ajuste</option>
                      </select>
                      <input name="quantity" type="number" min="1" placeholder="Qty" className="w-20 border rounded px-1 py-0.5" />
                      <input name="reason" placeholder="Motivo" className="w-40 border rounded px-1 py-0.5" />
                      <PendingButton className="px-2 py-1 border rounded" pendingText="Moviendo...">Mover</PendingButton>
                    </form>
                    <form action={updateProductBarcodeByForm} className="flex flex-wrap gap-2 items-center text-sm">
                      <input type="hidden" name="id" value={product.id} />
                      <input name="barcode" defaultValue={(product as any).barcode || ''} placeholder="EAN-13" className="w-40 border rounded px-1 py-0.5" />
                      <PendingButton className="px-2 py-1 bg-gray-800 text-white rounded" pendingText="Guardando...">Guardar codigo</PendingButton>
                      {!(product as any).barcode && (
                        <button name="generate" value="1" className="px-2 py-1 border rounded" title="Generar EAN-13">Generar</button>
                      )}
                    </form>
                    <StockHistory productId={product.id} />
                    <a className="text-blue-600 hover:underline" href={`/dashboard/admin/productos/${product.id}`}>Editar</a>
                    <SecretDeleteButton
                      action={deleteProductByForm as any}
                      hidden={{ id: product.id }}
                      label="Eliminar"
                      title="Eliminar producto"
                      description="Esta accion eliminara el producto y no se puede deshacer."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
