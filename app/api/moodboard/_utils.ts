import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getCurrentUserId(): Promise<string | null> {
  const session = (await getServerSession(authOptions as any)) as any;
  const id = session?.user?.id as string | undefined;
  if (!id) return null;
  return id;
}

