import { NextResponse } from 'next/server';
import { resetPassword } from '@/server/actions/auth';

export async function POST(req: Request) {
  try {
    const ct = (req.headers.get('content-type') || '').toLowerCase();
    let token = '';
    let password = '';
    if (ct.includes('application/json')) {
      const body = await req.json().catch(() => ({} as any));
      token = String(body?.token || '').trim();
      password = String(body?.password || '').trim();
    } else {
      const form = await req.formData().catch(() => null);
      token = String(form?.get('token') || '').trim();
      password = String(form?.get('password') || '').trim();
    }
    if (!token || !password) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
    const res = await resetPassword(token, password);
    return NextResponse.json({ ok: true, message: res?.message || 'Contraseña actualizada correctamente.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e || 'Error') }, { status: 400 });
  }
}

