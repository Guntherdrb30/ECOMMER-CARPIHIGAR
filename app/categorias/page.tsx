import { getCategoryGridData } from '@/server/actions/categories';
import CategoryGrid from '@/components/category-grid';

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
        <CategoryGrid items={items as any} />
      </div>
    </div>
  );
}
