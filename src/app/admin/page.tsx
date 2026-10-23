import { getSalesDashboard } from "@/app/actions/orders";
import { prisma } from "@/lib/prisma";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getSalesDashboard();
  const products = await prisma.product.findMany({
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
    ],
  });

  return <AdminDashboardView stats={stats} products={products} />;
}
