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
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {parent.name}
                  </h3>
                </Link>
                {parent.children?.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {parent.children.map((child: any) => (
                        <Link
                          key={child.id}
                          href={`/productos?categoria=${child.slug}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 text-sm transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                    {parent.children.some((c: any) => c.children?.length) && (
                      <div className="mt-3 space-y-2">
                        {parent.children.map((child: any) => (
                          child.children?.length ? (
                            <div key={`subs-${child.id}`}>
                              <div className="text-xs font-semibold text-gray-600 mb-1">{child.name}</div>
                              <div className="ml-1 flex flex-wrap gap-1.5">
                                {child.children.map((sub: any) => (
                                  <Link
                                    key={sub.id}
                                    href={`/productos?categoria=${sub.slug}`}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200 text-xs transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-4">
                  <Link href={`/productos?categoria=${parent.slug}`} className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                    Ver todo
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
