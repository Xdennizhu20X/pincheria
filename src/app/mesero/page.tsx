import { prisma } from "@/lib/prisma";
import { getAccompaniments } from "@/app/actions/menu";
import { getActiveOrders } from "@/app/actions/orders";
import { WaiterView } from "@/components/mesero/WaiterView";

export const dynamic = "force-dynamic";

export default async function MeseroPage() {
  const [products, accompaniments, activeOrders] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
      ],
    }),
    getAccompaniments(true),
    getActiveOrders(),
  ]);

  return (
    <WaiterView
      products={products}
      initialAccompaniments={accompaniments}
      initialActiveOrders={activeOrders}
    />
  );
}
