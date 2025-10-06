import { getSuppliers } from "@/server/actions/procurement";
import { createPO } from "@/server/actions/procurement";
import PoItemsEditor from "@/components/admin/po-items-editor";

export default async function NuevaOCPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const suppliers = await getSuppliers();
  const sp = (await searchParams) || {} as any;
  const error = sp.error;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Nueva Orden de Compra</h1>
      {error && <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">{error}</div>}
      <div className="form-card">
        <form action={async (formData) => {
          'use server';
          await createPO(formData);
        }} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Proveedor</label>
              <select name="supplierId" className="form-select" required>
                <option value="">Seleccione</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Fecha esperada</label>
              <input name="expectedAt" type="date" className="form-input" />
            </div>
            <div>
              <label className="form-label">Notas</label>
              <input name="notes" className="form-input" />
            </div>
          </div>

          <PoItemsEditor />

          <div>
            <button className="bg-green-600 text-white px-3 py-1 rounded">Crear OC</button>
          </div>
        </form>
      </div>
    </div>
  );
}
