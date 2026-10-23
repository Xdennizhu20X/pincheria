"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Flame, 
  AlertCircle, 
  Utensils, 
  Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { dispatchOrder, getKitchenOrders } from "@/app/actions/orders";
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
  notes: string | null;
  createdAt: Date;
  items: OrderItem[];
}

interface KitchenViewProps {
  initialOrders: Order[];
}

export function KitchenView({ initialOrders }: KitchenViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Actualizar temporizadores cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Polling automático cada 6 segundos para recibir nuevos pedidos en cocina
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const fresh = await getKitchenOrders();
        // Convertir strings de fechas a objetos Date
        const parsed = fresh.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
        }));
        setOrders(parsed);
      } catch (err) {
        console.error("Error al actualizar cocina:", err);
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      const fresh = await getKitchenOrders();
      setOrders(
        fresh.map((o) => ({
          ...o,
          createdAt: new Date(o.createdAt),
        }))
      );
      toast.info("Comandas actualizadas");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDispatch = async (orderId: string, orderNumber: number) => {
    try {
      // Feedback visual inmediato
      const card = document.getElementById(`order-card-${orderId}`);
      if (card) {
        gsap.to(card, {
          opacity: 0,
          x: 40,
          scale: 0.95,
          duration: 0.25,
          ease: "power2.inOut",
          onComplete: async () => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            const res = await dispatchOrder(orderId);
            if (res.success) {
              toast.success(`¡Comanda #${orderNumber} Despachada!`, {
                description: "Trasladada a la cola de Caja para cobro.",
              });
            } else {
              toast.error(res.error || "No se pudo despachar");
            }
          },
        });
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        await dispatchOrder(orderId);
      }
    } catch {
      toast.error("Error al despachar comanda");
    }
  };

  // Resumen de pinchos pendientes en el asador
  const totalPinchosOnGrill = orders.reduce((sum, order) => {
    return (
      sum +
      order.items
        .filter((it) => !it.productName.toLowerCase().includes("litro") && !it.productName.toLowerCase().includes("personal"))
        .reduce((iSum, it) => iSum + it.quantity, 0)
    );
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header Cocina KDS */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-slate-100 text-base leading-tight">
              Cocina & Asador (KDS)
            </h1>
            <p className="text-[11px] font-semibold text-amber-400">
              {orders.length} comandas en preparación
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-transform flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-amber-400")} />
          <span>Actualizar</span>
        </button>
      </header>

      {/* KPI Rápido para el Asador */}
      <div className="p-3.5">
        <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 rounded-2xl border border-amber-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80 block">
                Total de Pinchos al Fuego
              </span>
              <span className="text-xl font-black text-white">
                {totalPinchosOnGrill} unidades
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">En cola</span>
            <span className="text-sm font-black text-amber-400">
              {orders.length} mesas
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Comandas Cronológicas (FIFO) */}
      <div ref={containerRef} className="px-3.5 space-y-3.5">
        {orders.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
              <ChefHat className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-slate-200 text-base">
              ¡Sin comandas pendientes!
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Los nuevos pedidos que envíen los meseros aparecerán aquí de forma automática.
            </p>
          </div>
        ) : (
          orders.map((order, index) => {
            const minutesElapsed = Math.floor(
              (now - new Date(order.createdAt).getTime()) / (1000 * 60)
            );

            // Badge de urgencia por tiempo
            let timerColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
            if (minutesElapsed >= 15) {
              timerColor = "bg-rose-500/25 text-rose-300 border-rose-500/60 animate-pulse";
            } else if (minutesElapsed >= 10) {
              timerColor = "bg-amber-500/20 text-amber-300 border-amber-500/40";
            }

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-lg transition-all"
              >
                {/* Cabecera de la comanda */}
                <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <h2 className="font-black text-base text-white tracking-tight leading-none">
                        {order.tableNumber}
                      </h2>
                      <span className="text-[11px] font-medium text-slate-400 mt-0.5 inline-block">
                        Comanda #{order.orderNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "px-2.5 py-1 rounded-full border text-xs font-black flex items-center gap-1",
                        timerColor
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutesElapsed} min</span>
                    </div>
                  </div>
                </div>

                {/* Cliente / Referencia si existe */}
                {order.customerName && (
                  <div className="px-4 py-1.5 bg-slate-950/40 border-b border-slate-800/60 text-xs text-slate-400">
                    Cliente: <span className="font-bold text-slate-200">{order.customerName}</span>
                  </div>
                )}

                {/* Lista de platos a preparar */}
                <div className="p-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800/80 flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                        {item.quantity}x
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-slate-100 text-sm leading-snug">
                          {item.productName}
                        </h3>

                        {/* Acompañamiento destacado */}
                        {item.accompaniment ? (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                            <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Servir con: {item.accompaniment}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Bebida / Sin guarnición
                          </span>
                        )}

                        {item.notes && (
                          <p className="text-xs text-rose-300/90 font-medium italic mt-1 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/40 inline-block">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {order.notes && (
                    <div className="p-2.5 rounded-xl bg-orange-950/30 border border-orange-800/40 text-xs text-orange-200">
                      <span className="font-bold">Observación: </span>
                      {order.notes}
                    </div>
                  )}
                </div>

                {/* Botón de Despacho (Cocina -> Caja) */}
                <div className="p-3.5 bg-slate-850 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleDispatch(order.id, order.orderNumber)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Despachar Comanda (Mover a Cobro)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Navegación móvil */}
      <BottomNav />
    </div>
  );
}
