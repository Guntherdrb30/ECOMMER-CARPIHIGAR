import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AfterLogin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  if (!session?.user) {
    redirect('/auth/login');
  }
  if (role === 'ADMIN') redirect('/dashboard/admin');
  if (role === 'DELIVERY') redirect('/dashboard/delivery');
  if (role === 'ALIADO') redirect('/dashboard/aliado');
  redirect('/dashboard/cliente');
}
