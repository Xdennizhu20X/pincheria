import { getCashierOrders } from "@/app/actions/orders";
import { CashierView } from "@/components/caja/CashierView";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const initialOrders = await getCashierOrders();
  return <CashierView initialOrders={initialOrders} />;
}
