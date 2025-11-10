import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function CoursesSettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user = (session?.user as any) || {}
  const role = user?.role as string | undefined
  const email = String(user?.email || '').toLowerCase()
  const rootEmail = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase()
  const isAdmin = role === 'ADMIN'
  const isRoot = isAdmin && email === rootEmail
  if (!isAdmin && !isRoot) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Cursos (Ajustes)</h1>
        <div className="border border-red-200 bg-red-50 text-red-800 px-3 py-2 rounded">No autorizado</div>
      </div>
    )
  }
  return <>{children}</>
}

