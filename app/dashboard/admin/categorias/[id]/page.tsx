import Link from 'next/link';
import { getCategoryById, getCategoryTree, updateCategoryByForm } from '@/server/actions/categories';
import { PendingButton } from '@/components/pending-button';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [category, tree] = await Promise.all([
    getCategoryById(id),
    getCategoryTree(),
  ]);

  if (!category) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">Categoría no encontrada</div>
        <div className="mt-4"><Link href="/dashboard/admin/categorias" className="text-blue-600 hover:underline">Volver</Link></div>
      </div>
    );
  }

  // Ubicar el nodo actual en el árbol para excluir sus descendientes (evitar ciclos)
  const findNode = (nodes: any[], targetId: string): any | null => {
    for (const n of nodes) {
      if (n.id === targetId) return n;
      const found = n.children?.length ? findNode(n.children, targetId) : null;
      if (found) return found;
    }
    return null;
  };
  const node = findNode(tree as any[], id);
  const blockedIds = new Set<string>();
  const collectIds = (n: any) => {
    if (!n) return;
    blockedIds.add(n.id);
    n.children?.forEach((c: any) => collectIds(c));
  };
  collectIds(node);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar categoría</h1>
        <Link href="/dashboard/admin/categorias" className="text-blue-600 hover:underline">Volver a categorías</Link>
      </div>

      <div className="form-card">
        <form action={updateCategoryByForm} className="form-grid">
          <input type="hidden" name="id" value={category.id} />
          <label className="sr-only" htmlFor="name">Nombre</label>
          <input id="name" name="name" defaultValue={category.name} placeholder="Nombre" className="form-input" required />
          <label className="sr-only" htmlFor="slug">Slug</label>
          <input id="slug" name="slug" defaultValue={category.slug} placeholder="slug-ejemplo" className="form-input" required />
          <label className="sr-only" htmlFor="parentId">Padre</label>
          <select id="parentId" name="parentId" defaultValue={category.parentId || ''} className="form-select">
            <option value="">Principal</option>
            {(tree as any[]).map((p: any) => (
              <>
                {!blockedIds.has(p.id) && (
                  <option key={p.id} value={p.id}>{p.name}</option>
                )}
                {p.children?.map((c: any) => (
                  <>
                    {!blockedIds.has(c.id) && (
                      <option key={c.id} value={c.id}>{'— '}{c.name}</option>
                    )}
                    {c.children?.map((g: any) => (
                      !blockedIds.has(g.id) && (
                        <option key={g.id} value={g.id}>{'—— '}{g.name}</option>
                      )
                    ))}
                  </>
                ))}
              </>
            ))}
          </select>
          <PendingButton className="bg-blue-600 text-white px-3 py-1 rounded" pendingText="Guardando...">Guardar cambios</PendingButton>
        </form>
      </div>
    </div>
  );
}

