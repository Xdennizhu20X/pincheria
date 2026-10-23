import { getKitchenOrders } from "@/app/actions/orders";
import { KitchenView } from "@/components/cocina/KitchenView";

export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  const initialOrders = await getKitchenOrders();
  return <KitchenView initialOrders={initialOrders} />;
}
