import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  const c = await prisma.course.findUnique({ where: { id: params.id } })
  return NextResponse.json({ ok: !!c, course: c })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session || !role || (role !== 'ADMIN' && role !== 'VENDEDOR')) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as any
  const data: any = {}
  if (body.title != null) data.title = String(body.title).slice(0,160)
  if (body.summary != null) data.summary = String(body.summary).slice(0, 5000)
  if (body.priceUSD != null) data.priceUSD = Number(body.priceUSD) as any
  if (body.status) data.status = String(body.status) as any
  if (body.heroImageUrl != null) data.heroImageUrl = body.heroImageUrl || null
  if (body.videoUrl != null) data.videoUrl = body.videoUrl || null
  if (body.saleStartAt != null) data.saleStartAt = body.saleStartAt ? new Date(body.saleStartAt) : null
  if (body.saleEndAt != null) data.saleEndAt = body.saleEndAt ? new Date(body.saleEndAt) : null
  const c = await prisma.course.update({ where: { id: params.id }, data })
  // Sincroniza el producto virtual (si existe)
  try {
    const p = await prisma.product.findFirst({ where: { code: `course:${params.id}` } })
    if (p) {
      const pdata: any = {}
      if (data.title) pdata.name = `Curso: ${data.title}`
      if (data.summary != null) pdata.description = data.summary
      if (data.priceUSD != null) { pdata.priceUSD = data.priceUSD; pdata.priceClientUSD = data.priceUSD }
      if (data.heroImageUrl != null) pdata.images = data.heroImageUrl ? [data.heroImageUrl] : []
      if (data.videoUrl != null) pdata.videoUrl = data.videoUrl
      if (Object.keys(pdata).length) await prisma.product.update({ where: { id: p.id }, data: pdata })
    }
  } catch {}
  return NextResponse.json({ ok: true, course: c })
}

