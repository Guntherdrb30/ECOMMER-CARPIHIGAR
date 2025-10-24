import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { AllyDashboardSidebar } from "@/components/aliado/dashboard-sidebar";

export default async function AliadoDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login?callbackUrl=/dashboard/aliado");
  if ((session.user as any)?.role !== 'ALIADO') redirect("/auth/login?message=You Are Not Authorized!");
  return (
    <DashboardShell sidebar={<AllyDashboardSidebar />} title="Panel de Aliado">
      {children}
    </DashboardShell>
  );
}

