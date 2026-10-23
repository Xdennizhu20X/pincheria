import { getSalesDashboard } from "@/app/actions/orders";
import { getAccompaniments } from "@/app/actions/menu";
import { prisma } from "@/lib/prisma";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, products, accompaniments] = await Promise.all([
    getSalesDashboard(),
    prisma.product.findMany({
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
      ],
    }),
    getAccompaniments(false),
  ]);

  return (
    <AdminDashboardView
      stats={stats}
      products={products}
      initialAccompaniments={accompaniments}
    />
  );
}
