export const dynamic = 'force-static';

export default function PoliticaCookies() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Política de Cookies</h1>
      <p className="mt-4 text-gray-700">
        Utilizamos cookies necesarias para que el sitio funcione (por ejemplo, mantener tu sesión segura) y
        cookies opcionales para analizar el uso del sitio y mejorar nuestros servicios. Puedes aceptar solo
        las necesarias o todas desde el aviso de cookies.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-gray-900">Categorías</h2>
      <ul className="mt-2 list-disc pl-6 text-gray-700">
        <li><span className="font-medium">Necesarias:</span> Imprescindibles para el funcionamiento básico del sitio.</li>
        <li><span className="font-medium">Analíticas/Marketing:</span> Ayudan a medir el rendimiento y personalizar contenidos.</li>
      </ul>
      <p className="mt-8 text-gray-700">
        Puedes modificar tu elección borrando la cookie <code className="rounded bg-gray-100 px-1">cookie_consent</code> en tu navegador.
      </p>
    </div>
  );
}

