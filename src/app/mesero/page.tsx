import { prisma } from "@/lib/prisma";
import { WaiterView } from "@/components/mesero/WaiterView";

export const dynamic = "force-dynamic";

export default async function MeseroPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
    ],
  });

  return <WaiterView products={products} />;
}
