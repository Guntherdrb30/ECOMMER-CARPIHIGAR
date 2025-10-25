import { getCategoryGridData } from '@/server/actions/categories';
import CategoryGrid from '@/components/category-grid';
import CategorySubheader from '@/components/category-subheader';
import SubcategoryCarousel from '@/components/subcategory-carousel';

export default async function CategoriasPage() {
  const items = await getCategoryGridData();

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Categorias de productos</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Explora nuestra amplia gama de productos organizados por categoria.
          </p>
        </div>
        {/* Subheader con nombres de categorías madre */}
        <CategorySubheader items={items.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))} />

        {/* Tarjetas de categorías madre arriba */}
        <CategoryGrid items={items as any} showSearch={false} />

        {/* Carruseles de subcategorías por cada categoría madre */}
        <div className="mt-12 space-y-12">
          {items.map((c: any) => (
            <section key={c.id} id={`cat-${c.slug}`} className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3">{c.name}</h2>
              <SubcategoryCarousel items={(c.children || []).slice(0, 15)} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
