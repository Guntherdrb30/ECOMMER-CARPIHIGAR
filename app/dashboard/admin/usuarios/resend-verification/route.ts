import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const origin = new URL(req.url).origin;
    if (email) {
      try {
        await fetch(`${origin}/api/auth/resend-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch {}
    }
    return NextResponse.redirect(new URL('/dashboard/admin/usuarios?message=verification-resent', origin));
  } catch (e: any) {
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL('/dashboard/admin/usuarios?error=verification-failed', origin));
  }
}

