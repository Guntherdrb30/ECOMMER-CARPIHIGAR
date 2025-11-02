
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password, isAlly, isDelivery, deliveryCedula, deliveryPhone, deliveryAddress, deliveryMotoPlate, deliveryChassisSerial, deliveryIdImageUrl, deliverySelfieUrl, agreeDelivery } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const exist = await prisma.user.findUnique({
      where: { email },
    });

    if (exist) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CLIENTE',
        phone: (isDelivery ? (deliveryPhone || null) : null),
        alliedStatus: isAlly ? 'PENDING' : 'NONE',
        deliveryStatus: isDelivery ? 'PENDING' as any : 'NONE' as any,
        deliveryCedula: isDelivery ? (deliveryCedula || null) : null,
        deliveryAddress: isDelivery ? (deliveryAddress || null) : null,
        deliveryMotoPlate: isDelivery ? (deliveryMotoPlate || null) : null,
        deliveryChassisSerial: isDelivery ? (deliveryChassisSerial || null) : null,
        deliveryIdImageUrl: isDelivery ? (deliveryIdImageUrl || null) : null,
        deliverySelfieUrl: isDelivery ? (deliverySelfieUrl || null) : null,\r\n        deliveryAgreementAcceptedAt: (isDelivery && agreeDelivery) ? (new Date() as any) : null,\r\n        deliveryAgreementVersion: (isDelivery && agreeDelivery) ? 1 : null,\r\n        deliveryAgreementIp: (isDelivery && agreeDelivery) ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '') : null,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}



