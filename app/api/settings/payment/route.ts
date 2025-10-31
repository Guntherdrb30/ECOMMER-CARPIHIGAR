import { NextResponse } from 'next/server';
import { getSettings } from '@/server/actions/settings';

export async function GET() {
  const s = await getSettings();
  const payload = {
    paymentZelleEmail: (s as any).paymentZelleEmail || '',
    paymentPmPhone: (s as any).paymentPmPhone || '',
    paymentPmRif: (s as any).paymentPmRif || '',
    paymentPmBank: (s as any).paymentPmBank || '',
    paymentBanescoAccount: (s as any).paymentBanescoAccount || '',
    paymentBanescoRif: (s as any).paymentBanescoRif || '',
    paymentBanescoName: (s as any).paymentBanescoName || '',
    paymentMercantilAccount: (s as any).paymentMercantilAccount || '',
    paymentMercantilRif: (s as any).paymentMercantilRif || '',
    paymentMercantilName: (s as any).paymentMercantilName || '',
  };
  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
}

