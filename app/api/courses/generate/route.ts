import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

type GenerateBody = {
  topic: string
  priceUSD?: number
  saleStartAt?: string
  saleEndAt?: string
  heroImageUrl?: string
  videoUrl?: string
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role as string | undefined
    const email = (session?.user as any)?.email as string | undefined
    const ROOT_EMAIL = String(process.env.ROOT_EMAIL || 'root@carpihogar.com').toLowerCase()
    const isRoot = email && email.toLowerCase() === ROOT_EMAIL
    if (!session || !role || !(role === 'ADMIN' || isRoot)) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }
    const body = (await req.json().catch(() => ({}))) as GenerateBody
    const topic = String(body?.topic || '').trim()
    if (!topic) return NextResponse.json({ ok: false, error: 'Falta el tema del curso' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY no configurada' }, { status: 500 })

    const sys = [
      'Eres un productor de cursos senior para Carpihogar.',
      'Genera un curso profesional sobre el tema indicado, con módulos y clases prácticas.',
      'Incluye objetivos, público objetivo, requisitos, y un plan de contenidos con 4–8 módulos.',
      'Cada módulo debe tener 3–5 lecciones con título y breve descripción.',
      'Devuelve SOLO JSON con: title, summary, curriculum (array de módulos con {title, lessons:[{title, description}]}).'
    ].join('\n')

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Tema: ${topic}. Responde en JSON válido.` },
        ],
      }),
    })
    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: `OpenAI ${resp.status}` }, { status: 500 })
    }
    const data = await resp.json()
    const content: string = data?.choices?.[0]?.message?.content || ''
    let parsed: any = null
    try { parsed = JSON.parse(content) } catch {}
    if (!parsed || !parsed?.title || !Array.isArray(parsed?.curriculum)) {
      return NextResponse.json({ ok: false, error: 'No se pudo generar estructura del curso' }, { status: 200 })
    }

    const title: string = String(parsed.title).slice(0, 160)
    const summary: string = String(parsed.summary || '').slice(0, 2000)
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) + '-' + Math.random().toString(36).slice(2, 6)
    const priceUSD = Number(body?.priceUSD ?? 0) || 0
    const saleStartAt = body?.saleStartAt ? new Date(body.saleStartAt) : null
    const saleEndAt = body?.saleEndAt ? new Date(body.saleEndAt) : null
    const heroImageUrl = body?.heroImageUrl || null
    const videoUrl = body?.videoUrl || null

    const course = await prisma.course.create({
      data: {
        slug,
        title,
        topic,
        summary,
        curriculum: parsed.curriculum,
        priceUSD: priceUSD as any,
        status: 'PUBLISHED' as any,
        heroImageUrl: heroImageUrl || undefined,
        videoUrl: videoUrl || undefined,
        saleStartAt: saleStartAt || undefined,
        saleEndAt: saleEndAt || undefined,
      },
    })

    // Crear producto virtual para permitir carrito/checkout
    try {
      const pslug = `curso-${slug}`.slice(0, 80)
      const pname = `Curso: ${title}`.slice(0, 160)
      await prisma.product.create({
        data: {
          name: pname,
          slug: pslug,
          brand: 'Carpihogar Cursos',
          description: summary || `Curso sobre ${topic}`,
          images: heroImageUrl ? [heroImageUrl] : [],
          videoUrl: videoUrl || undefined,
          sku: `CUR-${course.id.slice(0,6)}`,
          code: `course:${course.id}`,
          priceUSD: (priceUSD || 0) as any,
          priceClientUSD: (priceUSD || 0) as any,
          stock: 999,
          isNew: true,
        } as any,
      })
    } catch (e) {
      console.warn('[courses.generate] no se pudo crear el producto virtual', e)
    }

    // Anuncio en Novedades (News)
    try {
      await prisma.news.create({
        data: {
          authorId: (session?.user as any)?.id,
          imageUrl: heroImageUrl || '/logo-default.svg',
          title: `Nuevo curso: ${title}`,
          // Incluye un token de enlace parseable para CTA directo en Novedades
          excerpt: `Inscripciones abiertas. Inicia: ${saleStartAt ? saleStartAt.toISOString().slice(0,10) : 'pronto'}. Más info: curso:/cursos/${slug}`,
        },
      })
    } catch {}

    return NextResponse.json({ ok: true, course })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
