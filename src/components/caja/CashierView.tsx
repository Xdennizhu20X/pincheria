"use client";

import React, { useState, useEffect } from "react";
import { 
  CircleDollarSign, 
  Search, 
  Receipt, 
  CheckCircle2, 
  Banknote, 
  CreditCard, 
  QrCode, 
  X, 
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { markOrderAsPaid, getCashierOrders } from "@/app/actions/orders";
import { formatCurrency, cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation/BottomNav";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  accompaniment: string | null;
  notes: string | null;
}

interface Order {
  id: string;
  orderNumber: number;
  tableNumber: string;
  customerName: string | null;
  waiterName: string;
  status: string;
  total: number;
  createdAt: Date;
  dispatchedAt: Date | null;
  items: OrderItem[];
}

interface CashierViewProps {
  initialOrders: Order[];
}

export function CashierView({ initialOrders }: CashierViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA">("EFECTIVO");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Polling automático cada 6 segundos para traer pedidos despachados
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const fresh = await getCashierOrders();
        setOrders(
          fresh.map((o) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            dispatchedAt: o.dispatchedAt ? new Date(o.dispatchedAt) : null,
          }))
        );
      } catch (err) {
        console.error("Error al actualizar caja:", err);
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      const fresh = await getCashierOrders();
      setOrders(
        fresh.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          dispatchedAt: o.dispatchedAt ? new Date(o.dispatchedAt) : null,
        }))
      );
      toast.info("Caja actualizada");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.tableNumber.toLowerCase().includes(q) ||
      o.orderNumber.toString().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  });

  const handleOpenPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentMethod("EFECTIVO");
    setAmountReceived(order.total.toFixed(2));
  };

  const handleQuickCash = (amount: number) => {
    setAmountReceived(amount.toFixed(2));
  };

  const receivedNum = parseFloat(amountReceived) || 0;
  const changeGiven = selectedOrder ? Math.max(0, receivedNum - selectedOrder.total) : 0;
  const isExactOrMore = selectedOrder ? receivedNum >= selectedOrder.total : false;

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    if (paymentMethod === "EFECTIVO" && receivedNum < selectedOrder.total) {
      toast.error("El monto recibido es menor al total de la cuenta");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await markOrderAsPaid(selectedOrder.id, {
        method: paymentMethod,
        amountReceived: paymentMethod === "EFECTIVO" ? receivedNum : selectedOrder.total,
        changeGiven: paymentMethod === "EFECTIVO" ? changeGiven : 0,
      });

      if (res.success) {
        toast.success(`¡Mesa ${selectedOrder.tableNumber} Pagada!`, {
          description: `Total: ${formatCurrency(selectedOrder.total)} • Vuelto: ${formatCurrency(
            paymentMethod === "EFECTIVO" ? changeGiven : 0
          )}`,
        });
        setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
        setSelectedOrder(null);
      } else {
        toast.error(res.error || "Error al procesar cobro");
      }
    } catch {
      toast.error("Ocurrió un error al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPendingAmount = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header Caja Móvil */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-slate-100 text-base leading-tight">
              Caja & Cobro
            </h1>
            <p className="text-[11px] font-semibold text-emerald-400">
              {orders.length} mesas pendientes por cobrar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-emerald-400")} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* Resumen de Cuentas por Cobrar */}
      <div className="p-3.5">
        <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 rounded-2xl border border-emerald-800/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80 block">
              Total Pendiente por Cobrar
            </span>
            <span className="text-xl font-black text-white">
              {formatCurrency(totalPendingAmount)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Cuentas activas</span>
            <span className="text-sm font-black text-emerald-400">
              {orders.length} mesas listas
            </span>
          </div>
        </div>
      </div>

      {/* Buscador de Mesas */}
      <div className="px-3.5 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por mesa, comanda o cliente..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Lista de Pedidos Despachados (Listos para Pagar) */}
      <div className="px-3.5 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-200 text-base">
              Sin cuentas pendientes
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Cuando la cocina termine y despache un pedido, aparecerá inmediatamente aquí para su cobro.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl shadow-sm space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-white">
                    {order.tableNumber}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    Comanda #{order.orderNumber}
                    {order.customerName && ` • ${order.customerName}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400 block">
                    {formatCurrency(order.total)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
              </div>

              {/* Vista preliminar de items */}
              <div className="p-2.5 bg-slate-950/60 rounded-xl space-y-1 text-xs">
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-slate-300">
                    <span className="line-clamp-1">
                      <strong className="text-orange-400">{it.quantity}x</strong> {it.productName}
                      {it.accompaniment && (
                        <span className="text-slate-400 text-[11px]"> ({it.accompaniment})</span>
                      )}
                    </span>
                    <span className="font-bold text-slate-400 shrink-0 ml-2">
                      {formatCurrency(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón de Cobro Directo */}
              <button
                type="button"
                onClick={() => handleOpenPayment(order)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <CircleDollarSign className="w-4 h-4" />
                <span>Cobrar Cuenta • {formatCurrency(order.total)}</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal / Bottom Sheet de Cobro con Calculadora de Vuelto */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header del Cobro */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Cobro de Mesa
                </span>
                <h2 className="font-black text-slate-100 text-lg">
                  {selectedOrder.tableNumber} (Comanda #{selectedOrder.orderNumber})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Cobro */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Total destacado */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Total a Cobrar
                </span>
                <span className="text-3xl font-black text-emerald-400">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Método de Pago:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("EFECTIVO")}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all active:scale-95",
                      paymentMethod === "EFECTIVO"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFERENCIA")}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all active:scale-95",
                      paymentMethod === "TRANSFERENCIA"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Transfer/Deuna</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TARJETA")}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all active:scale-95",
                      paymentMethod === "TARJETA"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>

              {/* Calculadora de Vuelto para Efectivo */}
              {paymentMethod === "EFECTIVO" && (
                <div className="space-y-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block">
                    ¿Con cuánto paga el cliente?
                  </label>

                  {/* Botones de billetes comunes en Ecuador */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(selectedOrder.total)}
                      className="py-1.5 px-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:border-emerald-500"
                    >
                      Exacto
                    </button>
                    {[5, 10, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickCash(val)}
                        className="py-1.5 px-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:border-emerald-500"
                      >
                        ${val}.00
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-base font-extrabold text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {/* Vuelto calculado en grande */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Vuelto a entregar:
                    </span>
                    <span
                      className={cn(
                        "text-xl font-black",
                        isExactOrMore ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {isExactOrMore
                        ? formatCurrency(changeGiven)
                        : `Faltan ${formatCurrency(selectedOrder.total - receivedNum)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Confirmar Pago */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95">
              <button
                type="button"
                disabled={isProcessing || (paymentMethod === "EFECTIVO" && !isExactOrMore)}
                onClick={handleConfirmPayment}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>
                  {isProcessing
                    ? "Registrando Pago..."
                    : `Cobrar ${formatCurrency(selectedOrder.total)} y Enviar a Historial`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación móvil */}
      <BottomNav />
    </div>
  );
}
