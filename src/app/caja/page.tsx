import { getCashierOrders } from "@/app/actions/orders";
import { getActiveMenuProducts, getAccompaniments } from "@/app/actions/menu";
import { CashierView } from "@/components/caja/CashierView";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const [initialOrders, products, accompaniments] = await Promise.all([
    getCashierOrders(),
    getActiveMenuProducts(),
    getAccompaniments(true),
  ]);

  return (
    <CashierView
      initialOrders={initialOrders}
      products={products}
      accompaniments={accompaniments}
    />
  );
}
