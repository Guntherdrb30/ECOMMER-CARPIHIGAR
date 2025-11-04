import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = String(url.searchParams.get('token') || '');
  if (!token) return NextResponse.redirect(url.origin + '/?error=Token%20inv%C3%A1lido');
  try {
    const now = new Date();
    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) return NextResponse.redirect(url.origin + '/?error=Token%20inv%C3%A1lido');
    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < now) {
      return NextResponse.redirect(url.origin + '/?error=Enlace%20expirado');
    }
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now as any, emailVerificationToken: null, emailVerificationTokenExpiresAt: null } });
    return NextResponse.redirect(url.origin + '/?message=' + encodeURIComponent('Correo verificado')); 
  } catch (e) {
    return NextResponse.redirect(new URL('/?error=' + encodeURIComponent('Error verificando correo'), req.url));
  }
}






