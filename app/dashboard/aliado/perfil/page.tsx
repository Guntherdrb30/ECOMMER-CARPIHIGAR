import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LogoUploader from "@/components/admin/logo-uploader";
import ImagesUploader from "@/components/admin/images-uploader";
import { updateAllyProfile } from "@/server/actions/ally-profile";

export default async function AllyProfilePage() {
  const session = await getServerSession(authOptions);
  const myId = (session?.user as any)?.id as string | undefined;
  if (!myId) {
    return <div className="p-4">Debes iniciar sesión.</div>;
  }
  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: {
      name: true,
      email: true,
      profileImageUrl: true,
      bio: true,
      services: true,
      portfolioUrls: true,
      portfolioText: true,
      role: true,
    },
  });

  if ((me as any)?.role !== 'ALIADO') {
    return <div className="p-4">Solo disponible para usuarios aliados.</div>;
  }

  const servicesStr = Array.isArray(me?.services) && me?.services?.length ? (me!.services as string[]).join(", ") : "";
  const portfolio = Array.isArray(me?.portfolioUrls) ? (me!.portfolioUrls as string[]) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil de Aliado</h1>
        <p className="text-gray-600">Agrega tu foto de perfil, biografía, servicios y ejemplos de trabajos para que los clientes puedan conocerte y contratarte.</p>
      </div>

      <form action={updateAllyProfile} className="space-y-8">
        {/* Foto de perfil */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Foto de Perfil</h2>
          {/* Hidden input preserves current value; LogoUploader actualizará este input */}
          <input type="hidden" name="profileImageUrl" defaultValue={me?.profileImageUrl || ''} />
          <div className="flex items-center gap-4">
            {me?.profileImageUrl ? (
              <img src={me.profileImageUrl} alt="Perfil" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 border" />
            )}
            <div className="flex-1">
              <LogoUploader targetInputName="profileImageUrl" defaultUrl={me?.profileImageUrl || undefined} />
            </div>
          </div>
        </div>

        {/* Biografía y Servicios */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Biografía y Servicios</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biografía</label>
              <textarea id="bio" name="bio" rows={5} defaultValue={me?.bio || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Cuenta tu historia como profesional, experiencia y enfoque." />
            </div>
            <div>
              <label htmlFor="services" className="block text-sm font-medium text-gray-700">Servicios (separados por coma)</label>
              <input id="services" name="services" type="text" defaultValue={servicesStr} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Carpintería de cocina, Closets, Diseño de interiores, Arquitectura" />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: Carpintería residencial, Diseño de cocinas, Arquitectura, Remodelaciones</p>
            </div>
          </div>
        </div>

        {/* Mis Trabajos (texto + imágenes) */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Mis Trabajos</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="portfolioText" className="block text-sm font-medium text-gray-700">Descripción de trabajos</label>
              <textarea id="portfolioText" name="portfolioText" rows={4} defaultValue={me?.portfolioText || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Describe los tipos de proyectos que has realizado y qué ofreces." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Galería (imágenes)</label>
              {/* Mantener imágenes existentes */}
              <div className="flex flex-wrap gap-2 mb-2">
                {portfolio.map((u) => (
                  <div key={u} className="w-20 h-20 border rounded overflow-hidden">
                    <img src={u} alt="work" className="w-full h-full object-cover" />
                    <input type="hidden" name="portfolioUrls[]" value={u} />
                  </div>
                ))}
              </div>
              {/* Subir nuevas (se agregan hidden inputs) */}
              <ImagesUploader targetName="portfolioUrls[]" max={12} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-brand text-white font-semibold px-5 py-2 rounded-lg hover:bg-opacity-90">Guardar Perfil</button>
        </div>
      </form>
    </div>
  );
}

