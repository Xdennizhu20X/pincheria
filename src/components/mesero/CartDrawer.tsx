"use client";

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  X, 
  ChevronUp, 
  Table2,
  User,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { createOrder, CreateOrderItemInput } from "@/app/actions/orders";

export interface CartItem extends CreateOrderItemInput {
  tempId: string;
}

interface CartDrawerProps {
  items: CartItem[];
  tableNumber: string;
  setTableNumber: (table: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  onUpdateQuantity: (tempId: string, delta: number) => void;
  onRemoveItem: (tempId: string) => void;
  onClearCart: () => void;
}

const PRESET_TABLES = [
  "Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4",
  "Mesa 5", "Mesa 6", "Mesa 7", "Mesa 8",
  "Barra", "Para Llevar"
];

export function CartDrawer({
  items,
  tableNumber,
  setTableNumber,
  customerName,
  setCustomerName,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (items.length === 0) return null;

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      toast.error("Por favor selecciona una mesa o indica 'Para Llevar'");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createOrder({
        tableNumber,
        customerName: customerName || undefined,
        waiterName: "Mesero Celular",
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          accompaniment: it.accompaniment,
          notes: it.notes,
        })),
      });

      if (res.success && res.order) {
        toast.success(`¡Comanda #${res.order.orderNumber} enviada a Cocina!`, {
          description: `${tableNumber} • Total: ${formatCurrency(res.order.total)}`,
        });
        onClearCart();
        setIsOpen(false);
      } else {
        toast.error(res.error || "Error al enviar comanda");
      }
    } catch {
      toast.error("Ocurrió un error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón flotante siempre visible sobre la barra de navegación */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-3 py-2 max-w-md mx-auto pointer-events-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-xl shadow-orange-500/30 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              {totalItemsCount}
            </div>
            <div className="text-left leading-tight">
              <span className="text-xs uppercase tracking-wider text-orange-100 block">
                {tableNumber || "Elegir mesa..."}
              </span>
              <span className="text-sm font-extrabold">Ver Pedido Actual</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight">
              {formatCurrency(totalAmount)}
            </span>
            <ChevronUp className="w-5 h-5 text-orange-100 animate-bounce" />
          </div>
        </button>
      </div>

      {/* Modal / Drawer expandible con el detalle del pedido */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header del carrito */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h2 className="font-extrabold text-slate-100 text-base">
                  Resumen del Pedido ({totalItemsCount} ítems)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Configuración rápida de Mesa */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Mesa / Ubicación:</span>
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {PRESET_TABLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTableNumber(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 shrink-0",
                        tableNumber === t
                          ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre o referencia del cliente (opcional)"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Lista de productos en el carrito */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-100 text-sm leading-snug">
                      {item.productName}
                    </h4>
                    {item.accompaniment && (
                      <p className="text-xs font-medium text-amber-400 mt-0.5">
                        <span className="text-slate-400">Con: </span>
                        {item.accompaniment}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        Nota: {item.notes}
                      </p>
                    )}
                    <span className="text-xs font-bold text-slate-300 mt-1 inline-block">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.tempId, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <span className="w-5 text-center font-bold text-sm text-slate-100">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.tempId, 1)}
                      className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con Total y Botón de Envío Directo a Cocina */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-slate-400">Total a Pagar:</span>
                <span className="text-xl font-black text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span>
                  {isSubmitting
                    ? "Enviando a Cocina..."
                    : `Enviar a Cocina • ${formatCurrency(totalAmount)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
