import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = String(url.searchParams.get('token') || '');
  if (!token) return NextResponse.redirect(url.origin + '/auth/login?error=invalid_token');
  try {
    const now = new Date();
    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
    if (!user) return NextResponse.redirect(url.origin + '/auth/login?error=invalid_token');
    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < now) {
      return NextResponse.redirect(url.origin + '/auth/login?error=token_expired');
    }
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now as any, emailVerificationToken: null, emailVerificationTokenExpiresAt: null } });
    return NextResponse.redirect(url.origin + '/auth/login?message=verified');
  } catch (e) {
    return NextResponse.redirect(new URL('/auth/login?error=server', req.url));
  }
}

