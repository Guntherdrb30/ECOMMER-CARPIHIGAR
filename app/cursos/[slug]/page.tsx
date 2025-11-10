import prisma from '@/lib/prisma'
import EnrollButton from '@/components/Courses/EnrollButton'

function Countdown({ to }: { to?: Date | null }) {
  if (!to) return null
  const now = new Date()
  const diff = (to.getTime() - now.getTime()) / 1000
  const positive = Math.max(0, diff)
  const d = Math.floor(positive / 86400)
  const h = Math.floor((positive % 86400) / 3600)
  const m = Math.floor((positive % 3600) / 60)
  return <span className="text-sm text-gray-700">Comienza en {d}d {h}h {m}m</span>
}

export default async function CursoDetailPage({ params }: { params: { slug: string }}) {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } })
  if (!course) return <div className="p-4">Curso no encontrado</div>
  const curriculum = (course.curriculum as any) || []
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <div className="text-sm">Certificado por <strong>Trends172</strong></div>
      </div>
      {course.heroImageUrl ? (<img src={course.heroImageUrl} alt={course.title} className="w-full h-64 object-cover rounded my-3" />) : null}
      {course.videoUrl ? (
        <div className="aspect-video w-full mb-3">
          <iframe src={course.videoUrl} className="w-full h-full rounded" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : null}
      <div className="text-gray-700 mb-3">{course.summary}</div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-bold">${Number(course.priceUSD as any).toFixed(2)}</div>
        <Countdown to={course.saleStartAt} />
      </div>
      <div className="mb-4"><EnrollButton id={course.id} title={course.title} priceUSD={Number(course.priceUSD as any) || 0} image={course.heroImageUrl} /></div>
      <h2 className="text-lg font-semibold mb-2">Contenido del curso</h2>
      <div className="space-y-2">
        {Array.isArray(curriculum) ? curriculum.map((m: any, i: number) => (
          <div key={i} className="border rounded p-3 bg-white">
            <div className="font-medium">{m?.title || `Módulo ${i+1}`}</div>
            {Array.isArray(m?.lessons) ? (
              <ul className="list-disc pl-6 text-sm text-gray-700 mt-2">
                {m.lessons.map((l: any, j: number) => (<li key={j}><span className="font-medium">{l?.title || `Lección ${j+1}`}:</span> {l?.description || ''}</li>))}
              </ul>
            ) : null}
          </div>
        )) : null}
      </div>
    </div>
  )
}
