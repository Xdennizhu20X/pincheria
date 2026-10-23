"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Receipt, 
  Flame, 
  Layers, 
  Check, 
  X,
  CreditCard,
  Banknote,
  QrCode,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { toggleProductActive } from "@/app/actions/menu";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { BottomNav } from "@/components/navigation/BottomNav";

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  accompaniment: string | null;
}

interface Payment {
  method: string;
  amountReceived: number;
  changeGiven: number;
}

interface PaidOrder {
  id: string;
  orderNumber: number;
  tableNumber: string;
  customerName: string | null;
  total: number;
  paidAt: Date | null;
  items: OrderItem[];
  payment: Payment | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  price: number;
  isActive: boolean;
}

interface AdminDashboardViewProps {
  stats: {
    totalSalesToday: number;
    ordersCountToday: number;
    averageTicketToday: number;
    totalSalesMonth: number;
    ordersCountMonth: number;
    topProducts: TopProduct[];
    todayOrders: PaidOrder[];
    pendingKitchenCount: number;
    pendingCashierCount: number;
  } | null;
  products: Product[];
}

export function AdminDashboardView({ stats, products: initialProducts }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"VENTAS" | "HISTORIAL" | "MENU">("VENTAS");
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const handleToggleProduct = async (prod: Product) => {
    try {
      const res = await toggleProductActive(prod.id, prod.isActive);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, isActive: res.product.isActive } : p))
        );
        toast.success(
          res.product.isActive
            ? `${prod.name} habilitado en el menú`
            : `${prod.name} pausado (no se mostrará a meseros)`
        );
      }
    } catch {
      toast.error("Error al actualizar estado del producto");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header Admin */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-black">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-slate-100 text-base leading-tight">
              Gestión & Ventas
            </h1>
            <p className="text-[11px] font-semibold text-slate-400">
              Métricas del día y control del menú
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span>Hoy</span>
        </div>
      </header>

      {/* Tabs Superiores */}
      <div className="p-3.5">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("VENTAS")}
            className={cn(
              "py-2.5 rounded-xl transition-all active:scale-95 text-center",
              activeTab === "VENTAS"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Ventas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("HISTORIAL")}
            className={cn(
              "py-2.5 rounded-xl transition-all active:scale-95 text-center",
              activeTab === "HISTORIAL"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Historial ({stats?.todayOrders.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MENU")}
            className={cn(
              "py-2.5 rounded-xl transition-all active:scale-95 text-center",
              activeTab === "MENU"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Menú ({products.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VENTAS & MÉTRICAS */}
      {activeTab === "VENTAS" && (
        <div className="px-3.5 space-y-3.5">
          {/* Tarjetas KPI de Ventas */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Ventas de Hoy
              </span>
              <span className="text-2xl font-black text-emerald-400 block">
                {formatCurrency(stats?.totalSalesToday ?? 0)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {stats?.ordersCountToday ?? 0} pedidos cobrados
              </span>
            </div>

            <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Ticket Promedio
              </span>
              <span className="text-2xl font-black text-orange-400 block">
                {formatCurrency(stats?.averageTicketToday ?? 0)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Por mesa atendida
              </span>
            </div>
          </div>

          {/* Acumulado del Mes */}
          <div className="p-4 bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-slate-900 rounded-3xl border border-orange-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-300/80 block">
                Total Ventas del Mes
              </span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(stats?.totalSalesMonth ?? 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Pedidos mes</span>
              <span className="text-base font-black text-orange-400">
                {stats?.ordersCountMonth ?? 0} comandas
              </span>
            </div>
          </div>

          {/* Estado de Colas Activas */}
          <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operación en Vivo en el Local
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                <span className="text-amber-300">En Cocina:</span>
                <span className="text-base font-black text-white">
                  {stats?.pendingKitchenCount ?? 0}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                <span className="text-emerald-300">Por Cobrar:</span>
                <span className="text-base font-black text-white">
                  {stats?.pendingCashierCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Platos más Vendidos */}
          <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Platos y Bebidas Más Vendidos
              </h3>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>

            {(!stats?.topProducts || stats.topProducts.length === 0) ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Aún no hay ventas registradas este mes.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.topProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-200">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-orange-400">
                        {p.quantity} vendidos
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5">
                        ({formatCurrency(p.revenue)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE PEDIDOS */}
      {activeTab === "HISTORIAL" && (
        <div className="px-3.5 space-y-3">
          {(!stats?.todayOrders || stats.todayOrders.length === 0) ? (
            <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-300 text-sm">
                Sin pedidos cobrados hoy
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los pedidos cobrados en caja se archivarán aquí.
              </p>
            </div>
          ) : (
            stats.todayOrders.map((order) => {
              const paidTime = order.paidAt
                ? new Date(order.paidAt).toLocaleTimeString("es-EC", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={order.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-white">
                        {order.tableNumber} (Comanda #{order.orderNumber})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Cobrado a las {paidTime}
                      </span>
                    </div>
                    <span className="text-base font-black text-emerald-400">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl space-y-1">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity}x {it.productName}
                          {it.accompaniment && (
                            <span className="text-slate-500"> ({it.accompaniment})</span>
                          )}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {formatCurrency(it.unitPrice * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                    <span className="flex items-center gap-1 font-semibold">
                      {order.payment?.method === "EFECTIVO" ? (
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {order.payment?.method || "EFECTIVO"}
                    </span>
                    {order.payment?.changeGiven ? (
                      <span>Vuelto: {formatCurrency(order.payment.changeGiven)}</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: GESTIÓN DE MENÚ Y DISPONIBILIDAD */}
      {activeTab === "MENU" && (
        <div className="px-3.5 space-y-2.5">
          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              Si un pincho o bebida se agota, puedes pausarlo aquí para que no aparezca a los meseros.
            </span>
          </div>

          {products.map((prod) => (
            <div
              key={prod.id}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductIcon name={prod.name} category={prod.category} size="sm" />
                <div className="min-w-0">
                  <h4
                    className={cn(
                      "font-bold text-xs sm:text-sm line-clamp-1",
                      prod.isActive ? "text-slate-100" : "text-slate-500 line-through"
                    )}
                  >
                    {prod.name}
                  </h4>
                  <span className="text-xs font-black text-orange-400">
                    {formatCurrency(prod.price)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleProduct(prod)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95",
                  prod.isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                )}
              >
                {prod.isActive ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Disponible</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Agotado</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navegación móvil */}
      <BottomNav />
    </div>
  );
}
