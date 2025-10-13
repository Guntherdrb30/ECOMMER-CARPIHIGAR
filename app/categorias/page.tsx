import { getCategories } from '@/server/actions/categories';
import Link from 'next/link';
import Image from 'next/image';

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Categorias de productos</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Explora nuestra amplia gama de productos organizados por categoria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {categories.map((category: any) => (
            <Link key={category.id} href={`/productos?categoria=${category.slug}`}>
              <div className="group block bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

