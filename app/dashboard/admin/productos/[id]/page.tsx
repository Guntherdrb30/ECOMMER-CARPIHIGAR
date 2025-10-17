import { getCategoriesFlattened } from "@/server/actions/categories";
import { getSuppliers } from "@/server/actions/procurement";
import { getProductById, updateProductFull, getRelatedIds, getProducts } from "@/server/actions/products";
import MainImageUploader from "@/components/admin/main-image-uploader";
import ImagesUploader from "@/components/admin/images-uploader";
import RelatedProductsPicker from "@/components/admin/related-products-picker";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: any = null;
  let categories: any[] = [];
  let suppliers: any[] = [];
  let allProducts: any[] = [];
  let relatedIds: string[] = [];
  try {
    const r = await Promise.all([
      getProductById(id),
      getCategoriesFlattened(),
      getSuppliers(),
      getProducts(),
      getRelatedIds(id),
    ]);
    product = r[0];
    categories = Array.isArray(r[1]) ? r[1] : [];
    suppliers = Array.isArray(r[2]) ? r[2] : [];
    allProducts = Array.isArray(r[3]) ? r[3] : [];
    relatedIds = Array.isArray(r[4]) ? r[4] : [];
  } catch {}

  if (!product) {
    return <div className="container mx-auto p-4">Producto no encontrado</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Editar Producto</h1>
      <form action={updateProductFull} className="form-card form-grid">
        <input type="hidden" name="id" value={product.id} />
        <input name="name" defaultValue={product.name} placeholder="Nombre" className="border rounded px-2 py-1" required />
        <input name="slug" defaultValue={product.slug} placeholder="slug-ejemplo" className="border rounded px-2 py-1" required />
        <input name="brand" defaultValue={(product as any).brand || ''} placeholder="Marca" className="border rounded px-2 py-1" required />
        <input name="sku" defaultValue={product.sku || ''} placeholder="SKU (opcional)" className="border rounded px-2 py-1" />
        <input name="priceUSD" type="number" step="0.01" defaultValue={Number(product.priceUSD)} placeholder="Precio USD" className="border rounded px-2 py-1" required />
        <input name="priceAllyUSD" type="number" step="0.01" defaultValue={product.priceAllyUSD ? Number(product.priceAllyUSD) : undefined} placeholder="Precio Aliado USD (opcional)" className="border rounded px-2 py-1" />
        <input name="stock" type="number" defaultValue={product.stock} placeholder="Stock" className="border rounded px-2 py-1" />
        <select name="categoryId" defaultValue={product.categoryId || ''} className="border rounded px-2 py-1">
          <option value="">Sin categoría</option>
          {(categories as any[]).map((c: any) => (
            <option key={c.id} value={c.id}>{`${'— '.repeat(c.depth || 0)}${c.name}`}</option>
          ))}
        </select>
        <select name="supplierId" defaultValue={(product as any).supplierId || ''} className="border rounded px-2 py-1">
          <option value="">Sin proveedor</option>
          {suppliers?.map?.((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="isNew" defaultChecked={product.isNew} /> Nuevo</label>
        <textarea name="description" defaultValue={product.description || ''} placeholder="Descripción" className="md:col-span-3 border rounded px-2 py-1" />

        <div className="md:col-span-3">
          <RelatedProductsPicker products={allProducts as any} name="relatedIds[]" defaultValue={relatedIds as any} watchCategoryName="categoryId" />
        </div>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-1">Imágenes actuales</h3>
            <div className="flex gap-2 flex-wrap">
              {(product.images as any as string[]).map((u) => (
                <div key={u} className="w-20 h-20 border rounded overflow-hidden">
                  <img src={u} alt="img" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Nueva imagen principal (opcional)</h3>
            <MainImageUploader targetName="mainImage" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Nuevas imágenes adicionales (opcional)</h3>
            <ImagesUploader targetName="images[]" max={3} />
          </div>
        </div>
        <div className="md:col-span-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="replaceAllImages" /> Reemplazar todas las imágenes (si marcas, solo se guardarán la nueva principal + nuevas adicionales)
          </label>
        </div>

        <div className="md:col-span-3 flex gap-2">
          <button className="bg-green-600 text-white px-3 py-1 rounded">Guardar cambios</button>
          <a href="/dashboard/admin/productos" className="px-3 py-1 rounded border">Volver</a>
        </div>
      </form>
    </div>
  );
}
