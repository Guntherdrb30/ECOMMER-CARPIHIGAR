import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePayablePdf } from '@/server/actions/payables';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const payable = await prisma.payable.findUnique({
    where: { id },
    include: { entries: true },
  });
  if (!payable) {
    return new NextResponse('Not found', { status: 404 });
  }

  const purchase = payable.purchaseId
    ? await prisma.purchase.findUnique({
        where: { id: payable.purchaseId },
        include: { supplier: true },
      })
    : null;
  const supplier = purchase?.supplier ?? null;

  const pdf = await generatePayablePdf({ payable, purchase, supplier });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="payable_${id}.pdf"`,
    },
  });
}

