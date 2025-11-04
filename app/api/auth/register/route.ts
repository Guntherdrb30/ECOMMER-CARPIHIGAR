
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password, isAlly, isDelivery, deliveryCedula, deliveryPhone, deliveryAddress, deliveryVehicleType, deliveryMotoPlate, deliveryChassisSerial, deliveryIdImageUrl, deliverySelfieUrl, agreeDelivery } = await req.json();
    const emailLc = String(email || '').trim().toLowerCase();

    if (!name || !emailLc || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const exist = await prisma.user.findUnique({
      where: { email: emailLc },
    });

    if (exist) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: emailLc,
        password: hashedPassword,
        role: 'CLIENTE',
        phone: (isDelivery ? (deliveryPhone || null) : null),
        alliedStatus: isAlly ? 'PENDING' : 'NONE',
        deliveryStatus: isDelivery ? 'PENDING' as any : 'NONE' as any,
        deliveryCedula: isDelivery ? (deliveryCedula || null) : null,
        deliveryAddress: isDelivery ? (deliveryAddress || null) : null,
        deliveryVehicleType: isDelivery ? (deliveryVehicleType || null) : null,
        deliveryMotoPlate: isDelivery ? (deliveryMotoPlate || null) : null,
        deliveryChassisSerial: isDelivery ? (deliveryChassisSerial || null) : null,
        deliveryIdImageUrl: isDelivery ? (deliveryIdImageUrl || null) : null,
        deliverySelfieUrl: isDelivery ? (deliverySelfieUrl || null) : null,
        deliveryAgreementAcceptedAt: (isDelivery && agreeDelivery) ? (new Date() as any) : null,
        deliveryAgreementVersion: (isDelivery && agreeDelivery) ? 1 : null,
        deliveryAgreementIp: (isDelivery && agreeDelivery) ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '') : null,
      },
    });

    // Send verification email (best-effort)
    try {
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken: token, emailVerificationTokenExpiresAt: expires as any, emailVerifiedAt: null } });
      if (process.env.EMAIL_ENABLED === 'true') {
        const { sendMail, basicTemplate } = await import('@/lib/mailer');
        const base = process.env.NEXT_PUBLIC_URL || new URL(req.url).origin;
        const verifyUrl = `${base}/api/auth/verify-email?token=${token}`;
        const html = basicTemplate('Verifica tu correo', `<p>Hola ${name || ''},</p><p>Confirma tu correo para activar tu cuenta:</p><p><a href="${verifyUrl}">Verificar correo</a></p><p>O copia este enlace:<br>${verifyUrl}</p>`);
        await sendMail({ to: emailLc, subject: 'Verifica tu correo', html });
      }
    } catch {}

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}




