import { DashboardSidebar } from "@/components/cliente/dashboard-sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";

export default async function ClienteDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Protect the route
  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard/cliente");
  }

  return (
    <DashboardShell sidebar={<DashboardSidebar />} title="Mi Cuenta">
      {children}
    </DashboardShell>
  );
}
