import { NextResponse } from 'next/server';

type CustomCartPayload = {
  productId: string;
  type: string;
  config: any;
  price: number;
  previewImage?: string | null;
};

export async function POST(request: Request) {
  let payload: CustomCartPayload | null = null;
  try {
    const json = await request.json();
    payload = json as CustomCartPayload;
  } catch {
    return NextResponse.json({ success: false, message: 'JSON inválido' }, { status: 400 });
  }

  if (!payload?.productId) {
    return NextResponse.json(
      { success: false, message: 'productId es requerido' },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: payload });
}

