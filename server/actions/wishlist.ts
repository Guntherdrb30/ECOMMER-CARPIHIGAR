'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get the current user's wishlist
export async function getWishlistItems(params?: { take?: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return [];
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: {
      user: { email: session.user.email },
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: params?.take,
  });

  return wishlistItems;
}

// Toggle an item in the user's wishlist
export async function toggleWishlistItem(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId,
      },
    },
  });

  if (existingItem) {
    // Item exists, so remove it (unlike)
    await prisma.wishlistItem.delete({
      where: {
        id: existingItem.id,
      },
    });
    revalidatePath('/dashboard/cliente/favoritos');
    revalidatePath('/'); // Revalidate home page
    return { added: false };
  } else {
    // Item does not exist, so add it (like)
    await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
    });
    revalidatePath('/dashboard/cliente/favoritos');
    revalidatePath('/'); // Revalidate home page
    return { added: true };
  }
}