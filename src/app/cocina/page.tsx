import { getKitchenOrders } from "@/app/actions/orders";
import { getActiveMenuProducts, getAccompaniments } from "@/app/actions/menu";
import { KitchenView } from "@/components/cocina/KitchenView";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  const [initialOrders, products, accompaniments] = await Promise.all([
    getKitchenOrders(),
    getActiveMenuProducts(),
    getAccompaniments(true),
  ]);

  return (
    <KitchenView
      initialOrders={initialOrders}
      products={products}
      accompaniments={accompaniments}
    />
  );
}
