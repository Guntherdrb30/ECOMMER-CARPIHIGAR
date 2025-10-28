import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LogoUploader from "@/components/admin/logo-uploader";
import ImagesUploader from "@/components/admin/images-uploader2";
import VideoUploader from "@/components/admin/video-uploader";
import { updateAllyProfile } from "@/server/actions/ally-profile";
import { createAllyProject } from "@/server/actions/ally-project";

export default async function AllyProfilePage() {
  const session = await getServerSession(authOptions);
  const myId = (session?.user as any)?.id as string | undefined;
  if (!myId) {
    return <div className="p-4">Debes iniciar sesion.</div>;
  }

  // Read my profile, tolerate missing columns if migrations aren't deployed yet
  let me: any = null;
  try {
    me = await prisma.user.findUnique({
      where: { id: myId },
      select: { name: true, email: true, profileImageUrl: true, bio: true, services: true, role: true },
    });
  } catch {
    try {
      const minimal = await prisma.user.findUnique({ where: { id: myId }, select: { name: true, email: true, role: true } });
      me = { ...(minimal || {}), profileImageUrl: null, bio: null, services: [] };
    } catch {
      me = { name: null, email: null, role: null, profileImageUrl: null, bio: null, services: [] };
    }
  }

  if ((me as any)?.role !== 'ALIADO') {
    return <div className="p-4">Solo disponible para usuarios aliados.</div>;
  }

  const servicesStr = Array.isArray(me?.services) && me?.services?.length ? (me!.services as string[]).join(", ") : "";

  // Load last projects with safe fallback
  let projects: { id: string; images: string[]; videoUrl: string | null; caption: string | null; createdAt?: any }[] = [];
  let postedToday = false;
  try {
    const rows = await prisma.allyProject.findMany({ where: { userId: myId }, orderBy: { createdAt: 'desc' }, take: 2 });
    if (rows.length) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      postedToday = (rows[0].createdAt as any) >= (start as any);
    }
    projects = rows.map((r: any) => ({ id: r.id, images: Array.isArray(r.images) ? r.images.slice(0,4) : [], videoUrl: r.videoUrl || null, caption: r.caption || null }));
  } catch {
    projects = [];
    postedToday = false;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil de Aliado</h1>
        <p className="text-gray-600">Actualiza tu foto, biografia y servicios. Publica un proyecto al dia; se guardaran tus ultimos 2.</p>
      </div>

      <form action={updateAllyProfile} className="space-y-8">
        {/* Foto de perfil */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Foto de Perfil</h2>
          {/* Hidden input preserves current value; LogoUploader actualizara este input */}
          <input type="hidden" name="profileImageUrl" defaultValue={me?.profileImageUrl || ''} />
          <div className="flex items-center gap-4">
            {me?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.profileImageUrl} alt="Perfil" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 border" />
            )}
            <div className="flex-1">
              <LogoUploader targetInputName="profileImageUrl" defaultUrl={me?.profileImageUrl || undefined} />
            </div>
          </div>
        </div>

        {/* Biografia y Servicios */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Biografia y Servicios</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biografia</label>
              <textarea id="bio" name="bio" rows={5} defaultValue={me?.bio || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Cuenta tu historia como profesional, experiencia y enfoque." />
            </div>
            <div>
              <label htmlFor="services" className="block text-sm font-medium text-gray-700">Servicios (separados por coma)</label>
              <input id="services" name="services" type="text" defaultValue={servicesStr} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Carpinteria de cocina, Closets, Diseno de interiores, Arquitectura" />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: Carpinteria residencial, Diseno de cocinas, Arquitectura, Remodelaciones</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-brand text-white font-semibold px-5 py-2 rounded-lg hover:bg-opacity-90">Guardar Perfil</button>
        </div>
      </form>

      {/* Nuevo Proyecto del Dia */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-700">Nuevo Proyecto del Dia</h2>
        <p className="text-sm text-gray-600">Maximo 1 proyecto por dia. Cada proyecto: hasta 4 imagenes y 1 video (max 20s). Solo se guardan tus ultimos 2 proyectos.</p>
        {postedToday && (
          <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">Ya publicaste un proyecto hoy. Vuelve manana para agregar otro.</div>
        )}
        <form action={createAllyProject} className="space-y-4">
          <div>
            <label htmlFor="projectCaption" className="block text-sm font-medium text-gray-700">Descripcion breve (opcional)</label>
            <textarea id="projectCaption" name="projectCaption" rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Cuentanos brevemente sobre este proyecto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagenes del proyecto (maximo 4)</label>
            <ImagesUploader targetName="projectImages[]" max={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video del proyecto (opcional, max 20s)</label>
            <input type="hidden" name="projectVideoUrl" />
            <VideoUploader targetInputName="projectVideoUrl" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={postedToday} className={`px-5 py-2 rounded-lg text-white ${postedToday ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand hover:bg-opacity-90'}`}>Publicar Proyecto</button>
          </div>
        </form>
      </div>

      {/* Mis Proyectos (ultimos 2) */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-700">Mis Proyectos (ultimos 2)</h2>
        {projects.length === 0 ? (
          <div className="text-sm text-gray-600">Aun no has publicado proyectos.</div>
        ) : (
          <div className="space-y-6">
            {projects.map((p) => (
              <div key={p.id} className="border rounded-lg p-3">
                {(p as any).caption && <div className="text-gray-800 mb-2 whitespace-pre-line">{(p as any).caption}</div>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(p as any).images?.slice(0,4).map((u: string, i: number) => (
                    <div key={i} className="w-full aspect-square overflow-hidden rounded border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt={`proj-${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {(p as any).videoUrl && (
                  <div className="mt-3">
                    <video src={(p as any).videoUrl} controls className="w-full rounded" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
