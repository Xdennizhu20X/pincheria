import { prisma } from "@/lib/prisma";
import { getAccompaniments } from "@/app/actions/menu";
import { WaiterView } from "@/components/mesero/WaiterView";

export const dynamic = "force-dynamic";

export default async function MeseroPage() {
  const [products, accompaniments] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
      ],
    }),
    getAccompaniments(true),
  ]);

  return <WaiterView products={products} initialAccompaniments={accompaniments} />;
}
