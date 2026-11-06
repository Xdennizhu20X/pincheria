"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Flame, 
  GlassWater, 
  Search, 
  ChefHat, 
  Utensils, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  User, 
  AlertTriangle,
  CircleDollarSign,
  Check,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { updateOrder } from "@/app/actions/orders";
import { ProductImage } from "@/components/ui/ProductImage";

export interface OrderItem {
  id?: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  accompaniment?: string | null;
  notes?: string | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableNumber: string;
  customerName: string | null;
  waiterName?: string;
  status: string;
  total: number;
  notes?: string | null;
  createdAt?: Date;
  dispatchedAt?: Date | null;
  items: OrderItem[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string | null;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  hasAccompaniments?: boolean;
}

export interface Accompaniment {
  id: string;
  name: string;
  isActive?: boolean;
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  products: Product[];
  accompaniments: Accompaniment[];
  mode?: "cocina" | "caja" | "mesero";
  onSaveSuccess: (updatedOrder: Order) => void;
}

interface EditableItem extends OrderItem {
  tempId: string;
}

export function EditOrderModal({
  isOpen,
  onClose,
  order,
  products = [],
  accompaniments = [],
  mode = "cocina",
  onSaveSuccess,
}: EditOrderModalProps) {
  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [sendBackToKitchen, setSendBackToKitchen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selector de menú para agregar cosas
  const [activeTab, setActiveTab] = useState<"ITEMS" | "AGREGAR">("ITEMS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"TODOS" | "PINCHO" | "BEBIDA">("PINCHO");
  const [selectedDrinkSize, setSelectedDrinkSize] = useState<string>("TODAS");

  // Sub-modal para elegir guarnición de un pincho que se está agregando
  const [pinchoToAdd, setPinchoToAdd] = useState<Product | null>(null);
  const [selectedAcc, setSelectedAcc] = useState<string>("");
  const [pinchoNotes, setPinchoNotes] = useState("");

  // Sub-modal para cambiar guarnición de un ítem existente
  const [editingAccItemTempId, setEditingAccItemTempId] = useState<string | null>(null);

  // Lista de guarniciones disponibles
  const accOptions = useMemo(() => {
    const list = accompaniments
      .filter((a) => a.isActive !== false)
      .map((a) => a.name);

    if (list.length === 0) {
      list.push(
        "Arroz, papa, choclo, menestra",
        "Arroz, menestra",
        "Papa, choclo",
        "Arroz, papa, choclo",
        "Sin guarnición (Solo pincho)"
      );
    } else {
      const hasNone = list.some(
        (n) =>
          n.toLowerCase().includes("sin guarnición") ||
          n.toLowerCase().includes("sin acompañamiento")
      );
      if (!hasNone) {
        list.push("Sin guarnición (Solo pincho)");
      }
    }
    return list;
  }, [accompaniments]);

  // Inicializar estado cuando se abre una orden
  useEffect(() => {
    if (order && isOpen) {
      setCustomerName(order.customerName || order.tableNumber || "");
      setOrderNotes(order.notes || "");
      setItems(
        order.items.map((it, idx) => ({
          ...it,
          tempId: it.id || `orig-${idx}-${Date.now()}`,
        }))
      );
      setSendBackToKitchen(false);
      setActiveTab("ITEMS");
      setSearchQuery("");
      setPinchoToAdd(null);
      setEditingAccItemTempId(null);
    }
  }, [order, isOpen]);

  // Selección de primera guarnición por defecto
  useEffect(() => {
    if (accOptions.length > 0 && !selectedAcc) {
      setSelectedAcc(accOptions[0]);
    }
  }, [accOptions, selectedAcc]);

  if (!isOpen || !order) return null;

  // Filtrado de productos del catálogo
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "TODOS" && p.category !== selectedCategory) {
      return false;
    }
    if (selectedCategory === "BEBIDA" && selectedDrinkSize !== "TODAS") {
      if (p.subCategory !== selectedDrinkSize) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Cálculo del total actual vs original
  const currentTotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const totalDifference = currentTotal - order.total;
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0);

  // Manejadores de cantidad
  const handleUpdateQuantity = (tempId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.tempId === tempId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as EditableItem[]
    );
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  // Agregar Bebida con 1 toque
  const handleAddDrink = (prod: Product) => {
    const existingIndex = items.findIndex(
      (it) => it.productId === prod.id && !it.accompaniment
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          tempId: `drink-${prod.id}-${Date.now()}`,
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 1,
          accompaniment: null,
          notes: null,
        },
      ]);
    }

    toast.success(`+1 ${prod.name} agregado`, { duration: 1500 });
  };

  // Iniciar agregado de pincho
  const handleStartAddPincho = (prod: Product) => {
    setPinchoToAdd(prod);
    setSelectedAcc(accOptions[0] || "Sin guarnición (Solo pincho)");
    setPinchoNotes("");
  };

  // Confirmar agregado de pincho con guarnición
  const handleConfirmAddPincho = () => {
    if (!pinchoToAdd) return;

    const trimmedNotes = pinchoNotes.trim() || null;
    const existingIndex = items.findIndex(
      (it) =>
        it.productId === pinchoToAdd.id &&
        it.accompaniment === selectedAcc &&
        it.notes === trimmedNotes
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          tempId: `pincho-${pinchoToAdd.id}-${Date.now()}`,
          productId: pinchoToAdd.id,
          productName: pinchoToAdd.name,
          unitPrice: pinchoToAdd.price,
          quantity: 1,
          accompaniment: selectedAcc,
          notes: trimmedNotes,
        },
      ]);
    }

    // Si estamos en caja y se agrega un pincho al fuego, sugerir mandar a cocina
    if (order.status === "DESPACHADO" || mode === "caja") {
      setSendBackToKitchen(true);
    }

    toast.success(`+1 ${pinchoToAdd.name} agregado`, {
      description: `Con: ${selectedAcc}`,
      duration: 2000,
    });

    setPinchoToAdd(null);
  };

  // Cambiar guarnición de un ítem existente
  const handleUpdateItemAccompaniment = (tempId: string, newAcc: string) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, accompaniment: newAcc } : it))
    );
    setEditingAccItemTempId(null);
    toast.info(`Guarnición actualizada: ${newAcc}`);
  };

  // Guardar cambios
  const handleSave = async () => {
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      toast.error("El nombre del cliente o mesa no puede estar vacío");
      return;
    }

    if (items.length === 0) {
      toast.error("El pedido debe contener al menos un producto");
      return;
    }

    try {
      setIsSubmitting(true);

      // Determinar estado final
      let finalStatus = order.status;
      if (sendBackToKitchen) {
        finalStatus = "PENDIENTE_COCINA";
      }

      const res = await updateOrder({
        orderId: order.id,
        customerName: trimmedName,
        tableNumber: trimmedName,
        notes: orderNotes.trim() || null,
        status: finalStatus,
        items: items.map((it) => ({
          productId: it.productId || null,
          productName: it.productName,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          accompaniment: it.accompaniment || null,
          notes: it.notes?.trim() || null,
        })),
      });

      if (res.success && res.order) {
        toast.success(`¡Comanda #${order.orderNumber} actualizada!`, {
          description:
            sendBackToKitchen
              ? "Reenviada a Cocina para preparación."
              : `Total actualizado: ${formatCurrency(res.order.total)}`,
        });
        onSaveSuccess(res.order as unknown as Order);
        onClose();
      } else {
        toast.error(res.error || "No se pudo actualizar el pedido");
      }
    } catch {
      toast.error("Ocurrió un error al guardar los cambios");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-lg bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        
        {/* Header Modal */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              #{order.orderNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-white text-base leading-tight">
                  Editar Comanda #{order.orderNumber}
                </h2>
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    order.status === "PENDIENTE_COCINA"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  )}
                >
                  {order.status === "PENDIENTE_COCINA" ? "En Cocina" : "En Caja"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Modifica platos, agrega más comida o bebidas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas: Ítems actuales vs Agregar cosas */}
        <div className="p-2.5 bg-zinc-900/60 border-b border-zinc-800 grid grid-cols-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ITEMS")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95",
              activeTab === "ITEMS"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-750"
            )}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Ítems del Pedido ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("AGREGAR")}
            className={cn(
              "py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95",
              activeTab === "AGREGAR"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20"
                : "bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-750"
            )}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Agregar Más Cosas</span>
          </button>
        </div>

        {/* CUERPO DEL MODAL (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: ÍTEMS DEL PEDIDO */}
          {activeTab === "ITEMS" && (
            <div className="space-y-4">
              {/* Cliente y Notas */}
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>A nombre de quién / Mesa:</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Mesa 4, Don Carlos, Juan..."
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Observaciones generales del pedido:</span>
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ej. Para llevar, cubiertos descartables..."
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Lista de Ítems */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                    Platos y Bebidas en la comanda:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("AGREGAR")}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar otro</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-zinc-300">
                      Has quitado todos los ítems de esta comanda.
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Debes agregar al menos un plato o bebida para poder guardar.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("AGREGAR")}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
                    >
                      Ver menú para agregar
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.tempId}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-white text-xs sm:text-sm leading-snug">
                            {item.productName}
                          </h4>
                          <span className="text-xs font-black text-amber-400 block mt-0.5">
                            {formatCurrency(item.unitPrice * item.quantity)}{" "}
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({formatCurrency(item.unitPrice)} c/u)
                            </span>
                          </span>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.tempId, -1)}
                            className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center active:scale-90 border border-zinc-700"
                            title="Disminuir cantidad"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Minus className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="w-6 text-center font-black text-xs sm:text-sm text-white">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.tempId, 1)}
                            className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center active:scale-90 shadow-sm shadow-orange-500/20"
                            title="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.tempId)}
                            className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 flex items-center justify-center active:scale-90 border border-rose-500/30 ml-1"
                            title="Eliminar este ítem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Guarnición (si aplica) */}
                      {item.accompaniment && (
                        <div className="pt-1 border-t border-zinc-800/80">
                          {editingAccItemTempId === item.tempId ? (
                            <div className="space-y-1.5 mt-1 animate-in fade-in duration-150">
                              <span className="text-[10px] font-bold text-amber-400 block">
                                Selecciona nueva guarnición:
                              </span>
                              <div className="grid grid-cols-1 gap-1">
                                {accOptions.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleUpdateItemAccompaniment(item.tempId, opt)}
                                    className={cn(
                                      "text-left px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                      item.accompaniment === opt
                                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                                        : "bg-black/60 border-zinc-700 text-zinc-300 hover:text-white"
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Servir con: {item.accompaniment}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingAccItemTempId(item.tempId)}
                                className="text-[10px] text-zinc-400 hover:text-amber-400 underline font-semibold"
                              >
                                Cambiar
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nota del ítem */}
                      {item.notes && (
                        <p className="text-[11px] text-rose-300 italic bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/40 inline-block">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Botón rápido para agregar más ítems */}
              <button
                type="button"
                onClick={() => setActiveTab("AGREGAR")}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-orange-500/40 text-orange-400 text-xs font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Agregar más productos a esta comanda</span>
              </button>

              {/* Opción si el pedido está en CAJA: ¿Reenviar a Cocina? */}
              {(order.status === "DESPACHADO" || mode === "caja") && (
                <div className="p-3 bg-gradient-to-r from-orange-950/40 via-zinc-900 to-zinc-950 border border-orange-500/30 rounded-2xl space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendBackToKitchen}
                      onChange={(e) => setSendBackToKitchen(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-orange-500 focus:ring-orange-500 bg-black cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-orange-300 block">
                        ¿Enviar comanda de vuelta a Cocina / Asador?
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {sendBackToKitchen
                          ? "✓ Al guardar, la comanda volverá a aparecer en la pantalla de Cocina para que el asador prepare los nuevos platos."
                          : "Dejar en Caja (útil si solo se agregaron bebidas frías o platos que ya están servidos)."}
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGREGAR PRODUCTOS DEL MENÚ */}
          {activeTab === "AGREGAR" && (
            <div className="space-y-3">
              {/* Buscador */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar pinchos, bebidas, tamaños..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Filtro de Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("PINCHO")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all border active:scale-95",
                    selectedCategory === "PINCHO"
                      ? "bg-gradient-to-r from-orange-500 to-red-600 border-orange-400 text-white shadow-md shadow-orange-500/20"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>🍢 Pinchos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory("BEBIDA")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all border active:scale-95",
                    selectedCategory === "BEBIDA"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md shadow-blue-500/20"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  <GlassWater className="w-3.5 h-3.5" />
                  <span>🥤 Bebidas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory("TODOS")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border active:scale-95",
                    selectedCategory === "TODOS"
                      ? "bg-zinc-100 border-white text-zinc-950 font-black"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  )}
                >
                  Ver Todos
                </button>
              </div>

              {/* Sub-filtro de bebidas */}
              {selectedCategory === "BEBIDA" && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none animate-in fade-in duration-150">
                  {["TODAS", "Personal", "1 Litro", "1.25 Litros", "2 Litros"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedDrinkSize(size)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all active:scale-95",
                        selectedDrinkSize === size
                          ? "bg-cyan-500 text-white font-black"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                      )}
                    >
                      {size === "TODAS" ? "Todos los tamaños" : size}
                    </button>
                  ))}
                </div>
              )}

              {/* Grilla compacta de productos */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (prod.category === "PINCHO" || prod.hasAccompaniments) {
                        handleStartAddPincho(prod);
                      } else {
                        handleAddDrink(prod);
                      }
                    }}
                    className="p-2.5 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-orange-500/50 rounded-2xl flex flex-col justify-between gap-2 cursor-pointer active:scale-95 transition-all shadow-md group"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shrink-0">
                      <ProductImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 left-1">
                        {prod.category === "PINCHO" ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-orange-500/30">
                            🍢 Pincho
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                            {prod.subCategory || "Bebida"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-xs leading-tight line-clamp-1 group-hover:text-orange-400">
                        {prod.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-black text-amber-400 text-xs">
                          {formatCurrency(prod.price)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL SECUNDARIO: ELEGIR GUARNICIÓN PARA EL PINCHO A AGREGAR */}
        {pinchoToAdd && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm p-4 flex flex-col justify-end sm:justify-center rounded-3xl animate-in fade-in duration-150">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block">
                    Seleccionar Guarnición
                  </span>
                  <h3 className="font-black text-white text-base">
                    {pinchoToAdd.name} ({formatCurrency(pinchoToAdd.price)})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPinchoToAdd(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Opciones de Guarnición */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-300 block mb-1">
                  ¿Cómo servir la porción?
                </span>
                {accOptions.map((opt) => {
                  const isSelected = selectedAcc === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedAcc(opt)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all active:scale-[0.98]",
                        isSelected
                          ? "bg-orange-500/20 border-orange-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      )}
                    >
                      <span>{opt}</span>
                      {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Nota opcional */}
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Instrucción al asador (Opcional):
                </label>
                <input
                  type="text"
                  value={pinchoNotes}
                  onChange={(e) => setPinchoNotes(e.target.value)}
                  placeholder="Ej. Bien asado, sin ají..."
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinchoToAdd(null)}
                  className="flex-1 py-3 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-700 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddPincho}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar al Pedido</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER TOTAL Y BOTÓN DE GUARDAR */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3 shrink-0">
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Total de la Comanda
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-amber-400">
                  {formatCurrency(currentTotal)}
                </span>
                {totalDifference !== 0 && (
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full border",
                      totalDifference > 0
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    )}
                  >
                    {totalDifference > 0
                      ? `+${formatCurrency(totalDifference)}`
                      : formatCurrency(totalDifference)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-bold block">
                Ítems totales
              </span>
              <span className="text-sm font-black text-white">
                {totalCount} productos
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-bold active:scale-95 transition-all"
            >
              Cerrar
            </button>

            <button
              type="button"
              disabled={isSubmitting || items.length === 0}
              onClick={handleSave}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? "Guardando cambios..."
                  : sendBackToKitchen
                  ? "Guardar y Enviar a Cocina"
                  : `Guardar Cambios (${formatCurrency(currentTotal)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
