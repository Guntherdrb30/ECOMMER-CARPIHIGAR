import AdminSidebar from '@/components/admin/sidebar';
import DashboardShell from '@/components/dashboard-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 print:px-0 print:py-0">
      <DashboardShell sidebar={<AdminSidebar />} title="Panel Admin">
        <div className="min-w-0">{children}</div>
      </DashboardShell>
    </div>
  );
}
