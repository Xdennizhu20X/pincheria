"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Receipt, 
  Flame, 
  Check, 
  X, 
  Banknote, 
  QrCode,
  Plus,
  Sparkles,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { toggleProductActive, createProduct, CreateProductInput } from "@/app/actions/menu";
import { ProductImage } from "@/components/ui/ProductImage";
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
  proofImage?: string | null;
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
  imageUrl: string | null;
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
  
  // Modal de nuevo producto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    category: "PINCHO" | "BEBIDA";
    subCategory: string;
    price: string;
    description: string;
    hasAccompaniments: boolean;
  }>({
    name: "",
    category: "PINCHO",
    subCategory: "",
    price: "",
    description: "",
    hasAccompaniments: true,
  });

  // Modal para ver foto de comprobante
  const [viewingProof, setViewingProof] = useState<string | null>(null);

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
            : `${prod.name} pausado temporalmente`
        );
      }
    } catch {
      toast.error("Error al actualizar producto");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      toast.error("Ingresa el nombre del producto");
      return;
    }
    const numPrice = parseFloat(newProduct.price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Ingresa un precio válido");
      return;
    }

    try {
      setIsCreating(true);
      const res = await createProduct({
        name: newProduct.name,
        category: newProduct.category,
        subCategory: newProduct.subCategory || undefined,
        price: numPrice,
        description: newProduct.description || undefined,
        hasAccompaniments: newProduct.category === "PINCHO" ? newProduct.hasAccompaniments : false,
      });

      if (res.success && res.product) {
        toast.success(`¡${res.product.name} agregado al menú!`);
        setProducts((prev) => [...prev, res.product]);
        setIsAddModalOpen(false);
        setNewProduct({
          name: "",
          category: "PINCHO",
          subCategory: "",
          price: "",
          description: "",
          hasAccompaniments: true,
        });
      } else {
        toast.error(res.error || "No se pudo crear el producto");
      }
    } catch {
      toast.error("Error al guardar producto");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-28 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header Admin */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Logo del Restaurante */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Logo La Ultima Oportunidad"
            className="w-10 h-10 rounded-full object-cover border border-amber-400/40 shadow-lg shadow-orange-500/20"
          />
          <div>
            <h1 className="font-black text-white text-sm sm:text-base leading-tight tracking-tight uppercase">
              La Última Oportunidad
            </h1>
            <p className="text-[10px] font-bold text-amber-400">
              Panel Administrativo & Ventas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span>Hoy</span>
        </div>
      </header>

      {/* Tabs Superiores */}
      <div className="p-3.5">
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab("VENTAS")}
            className={cn(
              "py-2.5 rounded-xl transition-all active:scale-95 text-center",
              activeTab === "VENTAS"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/25"
                : "text-zinc-400 hover:text-white"
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
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/25"
                : "text-zinc-400 hover:text-white"
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
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/25"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Menú ({products.length})
          </button>
        </div>
      </div>

      {/* TAB 1: VENTAS & MÉTRICAS */}
      {activeTab === "VENTAS" && (
        <div className="px-3.5 space-y-3.5">
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-1 shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Ventas de Hoy
              </span>
              <span className="text-2xl font-black text-emerald-400 block tracking-tight">
                {formatCurrency(stats?.totalSalesToday ?? 0)}
              </span>
              <span className="text-[11px] font-bold text-zinc-500 block">
                {stats?.ordersCountToday ?? 0} pedidos cobrados
              </span>
            </div>

            <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-1 shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Ticket Promedio
              </span>
              <span className="text-2xl font-black text-amber-400 block tracking-tight">
                {formatCurrency(stats?.averageTicketToday ?? 0)}
              </span>
              <span className="text-[11px] font-bold text-zinc-500 block">
                Por mesa atendida
              </span>
            </div>
          </div>

          {/* Acumulado del Mes */}
          <div className="p-4 bg-gradient-to-r from-orange-950/40 via-amber-950/30 to-zinc-950 rounded-3xl border border-orange-500/30 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-300/80 block">
                Total Ventas del Mes
              </span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(stats?.totalSalesMonth ?? 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-bold block">Comandas mes</span>
              <span className="text-base font-black text-amber-400">
                {stats?.ordersCountMonth ?? 0} órdenes
              </span>
            </div>
          </div>

          {/* Colas Activas */}
          <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Operación en Vivo en el Local
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                <span className="text-amber-300">En Asador:</span>
                <span className="text-lg font-black text-white">
                  {stats?.pendingKitchenCount ?? 0}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                <span className="text-emerald-300">Por Cobrar:</span>
                <span className="text-lg font-black text-white">
                  {stats?.pendingCashierCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Platos más Vendidos */}
          <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Platos y Bebidas Más Vendidos
              </h3>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>

            {(!stats?.topProducts || stats.topProducts.length === 0) ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                Aún no hay ventas registradas este mes.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.topProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 font-black flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-zinc-200">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-amber-400">
                        {p.quantity} vendidos
                      </span>
                      <span className="text-[11px] text-zinc-500 ml-1.5">
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
            <div className="py-16 text-center bg-zinc-950/60 rounded-3xl border border-zinc-900 p-6">
              <Receipt className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <h3 className="font-bold text-zinc-300 text-sm">
                Sin pedidos cobrados hoy
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
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
                  className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-white">
                        {order.tableNumber} (Comanda #{order.orderNumber})
                      </h4>
                      <span className="text-[11px] font-bold text-zinc-500">
                        Cobrado a las {paidTime}
                      </span>
                    </div>
                    <span className="text-base font-black text-emerald-400">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 bg-zinc-900/80 p-2.5 rounded-xl space-y-1">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity}x {it.productName}
                          {it.accompaniment && (
                            <span className="text-zinc-500"> ({it.accompaniment})</span>
                          )}
                        </span>
                        <span className="font-bold text-zinc-300">
                          {formatCurrency(it.unitPrice * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
                    <span className="flex items-center gap-1 font-bold">
                      {order.payment?.method === "EFECTIVO" ? (
                        <>
                          <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Efectivo</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Transferencia</span>
                        </>
                      )}
                    </span>

                    {order.payment?.proofImage && (
                      <button
                        type="button"
                        onClick={() => setViewingProof(order.payment?.proofImage || null)}
                        className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-bold text-[10px] flex items-center gap-1 active:scale-95"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Ver Comprobante</span>
                      </button>
                    )}

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

      {/* TAB 3: GESTIÓN DE MENÚ Y AGREGAR NUEVO */}
      {activeTab === "MENU" && (
        <div className="px-3.5 space-y-3">
          {/* Botón Destacado para Agregar Nuevo Producto al Menú */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-[0.98] transition-all text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Agregar Nuevo al Menú</span>
          </button>

          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              Si un pincho o bebida se agota en cocina, puedes pausarlo aquí para que no aparezca a los meseros.
            </span>
          </div>

          {products.map((prod) => (
            <div
              key={prod.id}
              className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                  <ProductImage
                    src={prod.imageUrl}
                    alt={prod.name}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4
                    className={cn(
                      "font-black text-xs sm:text-sm line-clamp-1",
                      prod.isActive ? "text-white" : "text-zinc-500 line-through"
                    )}
                  >
                    {prod.name}
                  </h4>
                  <span className="text-xs font-black text-amber-400">
                    {formatCurrency(prod.price)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleProduct(prod)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95",
                  prod.isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
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

      {/* MODAL PARA AGREGAR NUEVO AL MENÚ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="font-black text-white text-base">
                  Agregar Nuevo Plato o Bebida
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {/* Categoría */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Tipo de Producto:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, category: "PINCHO", hasAccompaniments: true })}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-bold border transition-all text-center",
                      newProduct.category === "PINCHO"
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    )}
                  >
                    🍢 Pincho al Carbón
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, category: "BEBIDA", hasAccompaniments: false })}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-bold border transition-all text-center",
                      newProduct.category === "BEBIDA"
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    )}
                  >
                    🥤 Bebida Fría
                  </button>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Nombre:</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej. Mixto Especial de Picaña o Bebida de 3L"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Precio ($ USD):</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="Ej. 3.50"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-orange-500 font-bold"
                />
              </div>

              {/* Subcategoría (si es bebida) */}
              {newProduct.category === "BEBIDA" && (
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Tamaño / Presentación:</label>
                  <input
                    type="text"
                    value={newProduct.subCategory}
                    onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
                    placeholder="Ej. Personal, 1 Litro, 2 Litros..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Descripción corta:</label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Ej. Asado con carbón de leña y adobo especial"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* ¿Incluye acompañamiento? */}
              {newProduct.category === "PINCHO" && (
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-zinc-300">¿Incluye las 4 guarniciones a elegir?</span>
                  <input
                    type="checkbox"
                    checked={newProduct.hasAccompaniments}
                    onChange={(e) => setNewProduct({ ...newProduct, hasAccompaniments: e.target.checked })}
                    className="w-5 h-5 accent-orange-500"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-[0.98] transition-all text-white font-black text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{isCreating ? "Guardando..." : "Guardar en el Menú"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA VER FOTO DE COMPROBANTE DE TRANSFERENCIA */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                Comprobante de Transferencia
              </span>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-zinc-850 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingProof}
                alt="Comprobante completo"
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
