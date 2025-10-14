import { getCategoryTree } from '@/server/actions/categories';
import Link from 'next/link';
import Image from 'next/image';

export default async function CategoriasPage() {
  const tree = await getCategoryTree();

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
          {(tree as any[]).map((parent: any) => (
            <div key={parent.id} className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
              <div className="p-5">
                <Link href={`/productos?categoria=${parent.slug}`} className="block">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                    {parent.name}
                  </h3>
                </Link>
                {parent.children?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-gray-700">
                    {parent.children.map((child: any) => (
                      <li key={child.id}>
                        <Link href={`/productos?categoria=${child.slug}`} className="hover:underline">
                          {'— '} {child.name}
                        </Link>
                        {child.children?.length > 0 && (
                          <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                            {child.children.map((sub: any) => (
                              <li key={sub.id}>
                                <Link href={`/productos?categoria=${sub.slug}`} className="hover:underline">
                                  {'—— '} {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
