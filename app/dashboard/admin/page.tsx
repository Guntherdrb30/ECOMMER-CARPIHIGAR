
import { getAllOrders } from "@/server/actions/orders";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user || role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/dashboard/admin");
  }

  const orders = await getAllOrders();

  const totalSales = orders.reduce(
    (acc, order) => acc + Number(order.totalUSD || 0),
    0,
  );
  const pendingPayment = orders.filter(
    (order) => order.status === "PENDIENTE",
  ).length;
  const shipped = orders.filter(
    // considera tanto ENVIADO como COMPLETADO como "enviados"
    (order) =>
      order.status === "ENVIADO" ||
      order.status === "COMPLETADO" ||
      order.status === "PAGADO",
  ).length;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard de Administrador</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold">Ventas Totales</h2>
          <p className="text-3xl">${totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold">Pendientes de Pago</h2>
          <p className="text-3xl">{pendingPayment}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold">Enviados</h2>
          <p className="text-3xl">{shipped}</p>
        </div>
      </div>

      {/* Add more sections for recent orders, etc. */}
    </div>
  );
}
