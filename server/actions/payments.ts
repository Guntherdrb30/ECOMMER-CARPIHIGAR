"use server";

import { PrismaClient, PaymentMethod, PaymentStatus, Currency } from "@prisma/client";

const prisma = new PrismaClient();

export async function createPayment(
  orderId: string,
  method: PaymentMethod,
  reference?: string,
  proofUrl?: string,
  currency: Currency = 'USD' as any,
  payerName?: string,
  payerPhone?: string,
  payerBank?: string,
  payerId?: string
) {
  const payment = await prisma.payment.create({
    data: {
      orderId,
      method,
      reference,
      proofUrl,
      status: PaymentStatus.EN_REVISION,
      currency,
      payerName: payerName || undefined,
      payerPhone: payerPhone || undefined,
      payerBank: payerBank || undefined,
      payerId: payerId || undefined,
    },
  });

  return payment;
}
