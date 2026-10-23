"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  X, 
  ChevronUp, 
  User, 
  Sparkles,
  Flame,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { createOrder, CreateOrderItemInput } from "@/app/actions/orders";

export interface CartItem extends CreateOrderItemInput {
  tempId: string;
  imageUrl?: string | null;
}

interface CartDrawerProps {
  items: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  onUpdateQuantity: (tempId: string, delta: number) => void;
  onRemoveItem: (tempId: string) => void;
  onClearCart: () => void;
}

const QUICK_NAMES = [
  "Para Llevar", "Barra", "Don Carlos", "Familia López"
];

export function CartDrawer({
  items,
  customerName,
  setCustomerName,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (items.length === 0) return null;

  const handleConfirmCancel = () => {
    onClearCart();
    setShowCancelConfirm(false);
    setIsOpen(false);
    toast.info("Pedido cancelado y descartado");
  };

  const handleSubmitOrder = async () => {
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      toast.error("Por favor ingresa a nombre de quién es el pedido");
      setIsOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createOrder({
        customerName: trimmedName,
        tableNumber: trimmedName,
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
        toast.success(`¡Comanda #${res.order.orderNumber} para ${trimmedName}!`, {
          description: `Total: ${formatCurrency(res.order.total)} • Enviada a cocina`,
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
      <div className="fixed bottom-20 left-0 right-0 z-30 px-3.5 max-w-md mx-auto pointer-events-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white font-extrabold shadow-2xl fire-glow flex items-center justify-between active:scale-[0.98] transition-all border border-orange-400/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black/30 backdrop-blur-xs flex items-center justify-center font-black text-sm border border-white/20">
              {totalItemsCount}
            </div>
            <div className="text-left leading-tight">
              <span className="text-[10px] uppercase font-black tracking-wider text-orange-200 block">
                {customerName ? `Para: ${customerName}` : "Ingresar nombre..."}
              </span>
              <span className="text-sm font-black tracking-tight">Ver Comanda Actual</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white">
              {formatCurrency(totalAmount)}
            </span>
            <ChevronUp className="w-5 h-5 text-orange-200 animate-bounce" />
          </div>
        </button>
      </div>

      {/* Modal / Drawer expandible con el detalle del pedido */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header del carrito */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                <h2 className="font-black text-white text-base">
                  Comanda ({totalItemsCount} ítems)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                  title="Cancelar y vaciar pedido"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 transition-transform border border-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Configuración de: ¿A nombre de quién? */}
            <div className="p-4 bg-zinc-900/60 border-b border-zinc-800/80 space-y-2.5">
              <label className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                <User className="w-4 h-4 text-orange-500" />
                <span>¿A nombre de quién es el pedido? (Obligatorio):</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  autoFocus={!customerName}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Juan Pérez, Don Carlos, Familia López..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500 shadow-inner"
                />
              </div>

              {/* Botones de sugerencia rápida */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
                <span className="text-[10px] font-bold text-zinc-500 shrink-0">Rápido:</span>
                {QUICK_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCustomerName(name)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 border",
                      customerName === name
                        ? "bg-orange-500/20 border-orange-500 text-orange-300"
                        : "bg-zinc-850 border-zinc-750 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de productos en el carrito */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="p-3 bg-zinc-900/90 border border-zinc-800/90 rounded-2xl flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-white text-xs sm:text-sm leading-snug">
                      {item.productName}
                    </h4>
                    {item.accompaniment && (
                      <p className="text-xs font-semibold text-amber-400 mt-0.5">
                        <span className="text-zinc-400">Servir con: </span>
                        {item.accompaniment}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-zinc-400 italic mt-0.5">
                        Nota: {item.notes}
                      </p>
                    )}
                    <span className="text-xs font-black text-amber-300 mt-1 inline-block">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.tempId, -1)}
                      className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center active:scale-90 border border-zinc-700"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <span className="w-5 text-center font-black text-xs sm:text-sm text-white">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.tempId, 1)}
                      className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center active:scale-90 shadow-sm shadow-orange-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con Total y Botón de Envío */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Total de la Comanda:
                </span>
                <span className="text-xl font-black text-amber-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {showCancelConfirm ? (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl space-y-2.5 text-center animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-xs font-bold text-rose-200">
                    ¿Estás seguro de cancelar este pedido? Se vaciarán los {totalItemsCount} productos.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700 active:scale-95 transition-transform"
                    >
                      Continuar pidiendo
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
                    >
                      Sí, Cancelar Pedido
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitOrder}
                    className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span>
                      {isSubmitting
                        ? "Enviando al asador..."
                        : customerName.trim()
                        ? `Enviar Comanda de ${customerName.trim()} • ${formatCurrency(totalAmount)}`
                        : `Ingresar Nombre para Enviar • ${formatCurrency(totalAmount)}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-2 text-xs font-bold text-rose-400/80 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancelar / Descartar este pedido</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
