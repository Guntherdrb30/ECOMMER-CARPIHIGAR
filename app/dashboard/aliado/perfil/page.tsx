import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AllyProfileForms from "@/components/aliado/ally-profile-forms";
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

      <AllyProfileForms
        defaultProfileImageUrl={me?.profileImageUrl || null}
        defaultBio={me?.bio || null}
        defaultServicesStr={servicesStr}
        postedToday={postedToday}
        onSaveProfile={updateAllyProfile as any}
        onCreateProject={createAllyProject as any}
      />

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
