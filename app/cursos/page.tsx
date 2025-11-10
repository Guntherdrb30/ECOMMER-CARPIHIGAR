import prisma from '@/lib/prisma'
import Link from 'next/link'

function Countdown({ to }: { to?: Date | null }) {
  if (!to) return null
  const now = new Date()
  const diff = (to.getTime() - now.getTime()) / 1000
  const positive = Math.max(0, diff)
  const d = Math.floor(positive / 86400)
  const h = Math.floor((positive % 86400) / 3600)
  const m = Math.floor((positive % 3600) / 60)
  return <span className="text-xs text-gray-600">Comienza en {d}d {h}h {m}m</span>
}

export default async function CursosPage() {
  const courses = await prisma.course.findMany({ where: { status: 'PUBLISHED' as any }, orderBy: { createdAt: 'desc' }, take: 50 })
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Cursos Carpihogar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Link key={c.id} href={`/cursos/${c.slug}`} className="border rounded-lg p-3 bg-white hover:shadow-sm">
            {c.heroImageUrl ? (<img src={c.heroImageUrl} alt={c.title} className="w-full h-40 object-cover rounded mb-2" />) : null}
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-gray-700 line-clamp-2">{c.summary || ''}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm font-semibold">${Number(c.priceUSD as any).toFixed(2)}</div>
              <Countdown to={c.saleStartAt} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

