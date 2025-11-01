import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login?callbackUrl=/dashboard/delivery');
  if ((session.user as any)?.role !== 'DELIVERY') redirect('/auth/login?message=You Are Not Authorized!');
  return <>{children}</>;
}