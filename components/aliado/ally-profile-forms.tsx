"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LogoUploader from "@/components/admin/logo-uploader";
import ImagesUploader from "@/components/admin/images-uploader2";
import VideoUploader from "@/components/admin/video-uploader";

type Props = {
  defaultProfileImageUrl?: string | null;
  defaultBio?: string | null;
  defaultServicesStr?: string;
  postedToday: boolean;
  onSaveProfile: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  onCreateProject: (formData: FormData) => Promise<{ ok: boolean; error?: string; id?: string }>;
};

export default function AllyProfileForms({
  defaultProfileImageUrl,
  defaultBio,
  defaultServicesStr,
  postedToday,
  onSaveProfile,
  onCreateProject,
}: Props) {
  const router = useRouter();

  return (
    <>
      <form
        action={async (formData) => {
          const res = await onSaveProfile(formData);
          if (res?.ok) {
            toast.success("Perfil guardado");
            router.refresh();
          } else {
            toast.error(res?.error || "No se pudo guardar el perfil");
          }
        }}
        className="space-y-8"
      >
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Foto de Perfil</h2>
          <input type="hidden" name="profileImageUrl" defaultValue={defaultProfileImageUrl || ''} />
          <div className="flex items-center gap-4">
            {defaultProfileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={defaultProfileImageUrl} alt="Perfil" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 border" />
            )}
            <div className="flex-1">
              <LogoUploader targetInputName="profileImageUrl" defaultUrl={defaultProfileImageUrl || undefined} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Biografia y Servicios</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biografia</label>
              <textarea id="bio" name="bio" rows={5} defaultValue={defaultBio || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Cuenta tu historia como profesional, experiencia y enfoque." />
            </div>
            <div>
              <label htmlFor="services" className="block text-sm font-medium text-gray-700">Servicios (separados por coma)</label>
              <input id="services" name="services" type="text" defaultValue={defaultServicesStr || ''} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Carpinteria de cocina, Closets, Diseno de interiores, Arquitectura" />
              <p className="text-xs text-gray-500 mt-1">Ejemplo: Carpinteria residencial, Diseno de cocinas, Arquitectura, Remodelaciones</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-brand text-white font-semibold px-5 py-2 rounded-lg hover:bg-opacity-90">Guardar Perfil</button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-700">Nuevo Proyecto del Dia</h2>
        <p className="text-sm text-gray-600">Maximo 1 proyecto por dia. Cada proyecto: hasta 4 imagenes y 1 video (max 20s). Solo se guardan tus ultimos 2 proyectos.</p>
        {postedToday && (
          <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm">Ya publicaste un proyecto hoy. Vuelve manana para agregar otro.</div>
        )}
        <form
          action={async (formData) => {
            const res = await onCreateProject(formData);
            if (res?.ok) {
              toast.success("Proyecto publicado");
              router.refresh();
            } else {
              toast.error(res?.error || "No se pudo publicar el proyecto");
            }
          }}
          className="space-y-4"
        >
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
    </>
  );
}

