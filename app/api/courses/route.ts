import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  const email = (session?.user as any)?.email as string | undefined
  const ROOT_EMAIL = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase()
  const isRoot = email && email.toLowerCase() === ROOT_EMAIL
  if (!session || !role || !(role === 'ADMIN' || isRoot)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  const list = await prisma.course.findMany({ orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, title: true, slug: true, status: true, priceUSD: true, createdAt: true } })
  return NextResponse.json({ ok: true, courses: list })
}
