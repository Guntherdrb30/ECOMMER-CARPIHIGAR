import BlobDiagnostics from '@/components/admin/blob-diagnostics';

export default async function AdminDiagnosticsPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Diagnósticos</h1>
      <p className="text-sm text-gray-600">Herramientas rápidas para verificar integraciones.</p>
      <BlobDiagnostics />
      <div>
        <a href="/dashboard/admin/productos" className="px-3 py-1 border rounded">Volver a Productos</a>
      </div>
    </div>
  );
}

