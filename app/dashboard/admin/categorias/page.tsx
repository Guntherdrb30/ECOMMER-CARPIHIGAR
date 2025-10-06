import { getCategories, getCategoryTree, createCategoryByForm, deleteCategoryByForm } from "@/server/actions/categories";
import SecretDeleteButton from "@/components/admin/secret-delete-button";

export default async function AdminCategoriesPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const [categories, tree, sp] = await Promise.all([
    getCategories(),
    getCategoryTree(),
    (async () => (await searchParams) || {})(),
  ]);
  const error = (sp as any).error;
  const message = (sp as any).message;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Gestionar Categorías</h1>
      {error && <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">{error}</div>}
      {message && <div className="border border-green-200 bg-green-50 text-green-800 px-3 py-2 rounded">{message}</div>}

      <div className="form-card">
        <h2 className="text-lg font-bold">Crear categoría</h2>
        <form action={createCategoryByForm} className="form-grid">
          <input name="name" placeholder="Nombre" className="form-input" required />
          <input name="slug" placeholder="slug-ejemplo" className="form-input" required />
          <select name="parentId" className="form-select">
            <option value="">Principal</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="bg-green-600 text-white px-3 py-1 rounded">Crear</button>
        </form>
      </div>

      <div className="form-card">
        <h2 className="text-lg font-bold mb-2">Árbol de categorías</h2>
        <CategoryTree nodes={tree as any[]} />
      </div>

      <div className="form-card">
        <h2 className="text-lg font-bold mb-2">Todas las Categorías</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Principal</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category: any) => (
                <tr key={category.id}>
                  <td className="border px-4 py-2">{category.name}</td>
                  <td className="border px-4 py-2">{category.slug}</td>
                  <td className="border px-4 py-2">{category.parentId ? 'Subcategoría' : 'Principal'}</td>
                  <td className="border px-4 py-2">
                    <SecretDeleteButton
                      action={deleteCategoryByForm as any}
                      hidden={{ id: category.id }}
                      label="Eliminar"
                      title="Eliminar categoría"
                      description="Esta acción eliminará la categoría. Requiere clave secreta."
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

function CategoryTree({ nodes }: { nodes: any[] }) {
  if (!nodes?.length) return <div className="text-sm text-gray-600">Sin categorías</div>;
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.id}>
          <div className="font-medium">{n.name}</div>
          {n.children?.length > 0 && (
            <ul className="ml-4 list-disc">
              {n.children.map((c: any) => (
                <li key={c.id}>
                  <div>{c.name}</div>
                  {c.children?.length > 0 && (
                    <ul className="ml-4 list-[circle]">
                      {c.children.map((g: any) => (
                        <li key={g.id}>{g.name}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
