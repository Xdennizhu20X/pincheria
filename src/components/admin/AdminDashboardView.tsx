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
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Utensils,
  Pencil,
  Lock,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  RotateCcw,
  CheckCircle2,
  FileText,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  toggleProductActive, 
  createProduct, 
  updateProduct,
  deleteProduct,
  CreateProductInput,
  createAccompaniment,
  toggleAccompanimentActive,
  deleteAccompaniment
} from "@/app/actions/menu";
import { 
  resetSalesHistory, 
  closeSalesShift, 
  getFilteredSalesHistory,
  SalesHistoryFilter 
} from "@/app/actions/orders";
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
  closureId?: string | null;
  closure?: { closureNumber: number } | null;
  items: OrderItem[];
  payment: Payment | null;
}

export interface ClosureRecord {
  id: string;
  closureNumber: number;
  openedAt: Date;
  closedAt: Date;
  totalSales: number;
  totalCash: number;
  totalTransfer: number;
  ordersCount: number;
  itemsSummary: string | null;
  notes: string | null;
  closedBy?: string;
}

export interface CurrentShiftData {
  totalSales: number;
  totalCash: number;
  totalTransfer: number;
  ordersCount: number;
  averageTicket: number;
  topProducts: TopProduct[];
  orders: PaidOrder[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  price: number;
  imageUrl: string | null;
  description?: string | null;
  hasAccompaniments?: boolean;
  isActive: boolean;
}

interface Accompaniment {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface AdminDashboardViewProps {
  stats: {
    currentShift?: CurrentShiftData;
    lastClosure?: ClosureRecord | null;
    recentClosures?: ClosureRecord[];
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
  initialAccompaniments?: Accompaniment[];
}

export function AdminDashboardView({
  stats,
  products: initialProducts,
  initialAccompaniments = [],
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"VENTAS" | "HISTORIAL" | "MENU">("VENTAS");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>(initialAccompaniments);
  const [menuSubTab, setMenuSubTab] = useState<"PRODUCTOS" | "GUARNICIONES">("PRODUCTOS");
  const [newAccName, setNewAccName] = useState("");
  const [isCreatingAcc, setIsCreatingAcc] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Estado del turno actual (Venta Actual)
  const [currentShift, setCurrentShift] = useState<CurrentShiftData>(
    stats?.currentShift || {
      totalSales: 0,
      totalCash: 0,
      totalTransfer: 0,
      ordersCount: 0,
      averageTicket: 0,
      topProducts: [],
      orders: [],
    }
  );

  // Cierres y Último Cierre
  const [lastClosure, setLastClosure] = useState<ClosureRecord | null>(
    stats?.lastClosure
      ? {
          ...stats.lastClosure,
          openedAt: new Date(stats.lastClosure.openedAt),
          closedAt: new Date(stats.lastClosure.closedAt),
        }
      : null
  );
  const [closuresList, setClosuresList] = useState<ClosureRecord[]>(
    (stats?.recentClosures || []).map((c) => ({
      ...c,
      openedAt: new Date(c.openedAt),
      closedAt: new Date(c.closedAt),
    }))
  );

  // Modal para Cierre de Turno
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [closureNotes, setClosureNotes] = useState("");
  const [isClosingShift, setIsClosingShift] = useState(false);

  // Sub-tabs y filtros en "HISTORIAL"
  const [historySubTab, setHistorySubTab] = useState<"ORDENES" | "CIERRES">("ORDENES");
  const [dateRangeType, setDateRangeType] = useState<"HOY" | "AYER" | "SEMANA" | "MES" | "TODOS" | "CUSTOM">("HOY");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<"TODOS" | "EFECTIVO" | "TRANSFERENCIA">("TODOS");
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);

  // Datos filtrados para el historial
  const [filteredOrders, setFilteredOrders] = useState<PaidOrder[]>(stats?.todayOrders || []);
  const [filteredClosures, setFilteredClosures] = useState<ClosureRecord[]>(
    (stats?.recentClosures || []).map((c) => ({
      ...c,
      openedAt: new Date(c.openedAt),
      closedAt: new Date(c.closedAt),
    }))
  );
  const [filteredSummary, setFilteredSummary] = useState({
    totalSales: stats?.totalSalesToday ?? 0,
    totalCash: (stats?.todayOrders || []).reduce(
      (s, o) => s + (o.payment?.method === "EFECTIVO" ? o.total : 0),
      0
    ),
    totalTransfer: (stats?.todayOrders || []).reduce(
      (s, o) => s + (o.payment?.method === "TRANSFERENCIA" ? o.total : 0),
      0
    ),
    ordersCount: stats?.ordersCountToday ?? 0,
    averageTicket: stats?.averageTicketToday ?? 0,
    topProducts: stats?.topProducts || [],
  });

  // Modal para ver detalle de un cierre específico
  const [selectedClosure, setSelectedClosure] = useState<ClosureRecord | null>(null);

  // Cierre de ventas del turno
  const handleExecuteCloseShift = async () => {
    try {
      setIsClosingShift(true);
      const res = await closeSalesShift({
        notes: closureNotes.trim() || undefined,
        closedBy: "Administrador",
      });

      if (res.success && res.closure) {
        toast.success(`¡Cierre de Ventas #${res.closure.closureNumber} completado!`, {
          description: `Total cerrado: ${formatCurrency(res.closure.totalSales)} • Turno reiniciado a $0.00`,
        });

        const newClosureRecord: ClosureRecord = {
          ...res.closure,
          openedAt: new Date(res.closure.openedAt),
          closedAt: new Date(res.closure.closedAt),
        };
        setLastClosure(newClosureRecord);
        setClosuresList((prev) => [newClosureRecord, ...prev]);

        // Reiniciar turno actual a cero ("se queda lista para empezar la otra venta")
        setCurrentShift({
          totalSales: 0,
          totalCash: 0,
          totalTransfer: 0,
          ordersCount: 0,
          averageTicket: 0,
          topProducts: [],
          orders: [],
        });

        setIsCloseShiftModalOpen(false);
        setClosureNotes("");

        // Refrescar historial
        handleApplyFilter("HOY");
      } else {
        toast.error(res.error || "No se pudo cerrar el turno");
      }
    } catch {
      toast.error("Ocurrió un error al procesar el cierre");
    } finally {
      setIsClosingShift(false);
    }
  };

  // Filtrado de historial
  const handleApplyFilter = async (
    rangeOverride?: "HOY" | "AYER" | "SEMANA" | "MES" | "TODOS" | "CUSTOM",
    paymentOverride?: "TODOS" | "EFECTIVO" | "TRANSFERENCIA"
  ) => {
    const range = rangeOverride || dateRangeType;
    const payment = paymentOverride || paymentMethodFilter;

    try {
      setIsLoadingFiltered(true);
      const res = await getFilteredSalesHistory({
        rangeType: range,
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        paymentMethod: payment,
        searchQuery: searchHistoryQuery || undefined,
      });

      if (res) {
        setFilteredOrders(
          res.orders.map((o) => ({
            ...o,
            paidAt: o.paidAt ? new Date(o.paidAt) : null,
          }))
        );
        setFilteredClosures(
          res.closures.map((c) => ({
            ...c,
            openedAt: new Date(c.openedAt),
            closedAt: new Date(c.closedAt),
          }))
        );
        setFilteredSummary({
          totalSales: res.totalSales,
          totalCash: res.totalCash,
          totalTransfer: res.totalTransfer,
          ordersCount: res.ordersCount,
          averageTicket: res.averageTicket,
          topProducts: res.topProducts,
        });
      }
    } catch (err) {
      console.error("Error al filtrar historial:", err);
      toast.error("No se pudo cargar el historial filtrado");
    } finally {
      setIsLoadingFiltered(false);
    }
  };
  
  // Modal de nuevo producto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    category: "PINCHO" | "BEBIDA";
    subCategory: string;
    price: string;
    description: string;
    imageUrl: string;
    hasAccompaniments: boolean;
  }>({
    name: "",
    category: "PINCHO",
    subCategory: "",
    price: "",
    description: "",
    imageUrl: "",
    hasAccompaniments: true,
  });

  // Modal de edición de producto
  const [editingProduct, setEditingProduct] = useState<{
    id: string;
    name: string;
    category: "PINCHO" | "BEBIDA";
    subCategory: string;
    price: string;
    description: string;
    imageUrl: string;
    hasAccompaniments: boolean;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal para confirmar eliminación de producto
  const [deletingProductTarget, setDeletingProductTarget] = useState<Product | null>(null);
  const [isDeletingProd, setIsDeletingProd] = useState(false);

  // Modal para ver foto de comprobante
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = Math.min(img.width, MAX_WIDTH);
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setNewProduct((prev) => ({ ...prev, imageUrl: dataUrl }));
        toast.success("Foto del producto cargada con éxito");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
        imageUrl: newProduct.imageUrl || undefined,
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
          imageUrl: "",
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

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = Math.min(img.width, MAX_WIDTH);
        canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setEditingProduct((prev) => (prev ? { ...prev, imageUrl: dataUrl } : null));
        toast.success("Foto del producto actualizada");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct({
      id: prod.id,
      name: prod.name,
      category: prod.category as "PINCHO" | "BEBIDA",
      subCategory: prod.subCategory || "",
      price: prod.price.toString(),
      description: prod.description || "",
      imageUrl: prod.imageUrl || "",
      hasAccompaniments: prod.hasAccompaniments ?? (prod.category === "PINCHO"),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      toast.error("Ingresa el nombre del producto");
      return;
    }
    const numPrice = parseFloat(editingProduct.price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Ingresa un precio válido");
      return;
    }

    try {
      setIsUpdating(true);
      const res = await updateProduct(editingProduct.id, {
        name: editingProduct.name,
        category: editingProduct.category,
        subCategory: editingProduct.subCategory || undefined,
        price: numPrice,
        description: editingProduct.description || undefined,
        imageUrl: editingProduct.imageUrl || undefined,
        hasAccompaniments: editingProduct.category === "PINCHO" ? editingProduct.hasAccompaniments : false,
      });

      if (res.success && res.product) {
        toast.success(`¡${res.product.name} actualizado con éxito!`);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...res.product } : p))
        );
        setEditingProduct(null);
      } else {
        toast.error(res.error || "No se pudo actualizar el producto");
      }
    } catch {
      toast.error("Error al actualizar producto");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProductTarget) return;
    try {
      setIsDeletingProd(true);
      const res = await deleteProduct(deletingProductTarget.id);
      if (res.success) {
        toast.info(`"${deletingProductTarget.name}" eliminado del menú`);
        setProducts((prev) => prev.filter((p) => p.id !== deletingProductTarget.id));
        setDeletingProductTarget(null);
      } else {
        toast.error(res.error || "No se pudo eliminar el producto");
      }
    } catch {
      toast.error("Error al eliminar el producto");
    } finally {
      setIsDeletingProd(false);
    }
  };

  const handleCreateAccompaniment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      toast.error("Ingresa el nombre de la guarnición");
      return;
    }
    try {
      setIsCreatingAcc(true);
      const res = await createAccompaniment(newAccName);
      if (res.success && res.accompaniment) {
        setAccompaniments((prev) => [...prev, res.accompaniment]);
        setNewAccName("");
        toast.success(`Guarnición "${res.accompaniment.name}" agregada`);
      } else {
        toast.error(res.error || "No se pudo crear la guarnición");
      }
    } catch {
      toast.error("Error al guardar guarnición");
    } finally {
      setIsCreatingAcc(false);
    }
  };

  const handleToggleAccompaniment = async (acc: Accompaniment) => {
    try {
      const res = await toggleAccompanimentActive(acc.id, acc.isActive);
      if (res.success && res.accompaniment) {
        setAccompaniments((prev) =>
          prev.map((a) => (a.id === acc.id ? { ...a, isActive: res.accompaniment.isActive } : a))
        );
        toast.success(
          res.accompaniment.isActive
            ? `"${acc.name}" disponible para meseros`
            : `"${acc.name}" pausada temporalmente`
        );
      }
    } catch {
      toast.error("Error al actualizar guarnición");
    }
  };

  const handleDeleteAccompaniment = async (accId: string, accName: string) => {
    try {
      const res = await deleteAccompaniment(accId);
      if (res.success) {
        setAccompaniments((prev) => prev.filter((a) => a.id !== accId));
        toast.info(`"${accName}" eliminada`);
      } else {
        toast.error(res.error || "No se pudo eliminar");
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleResetSales = async () => {
    try {
      setIsResetting(true);
      const res = await resetSalesHistory();
      if (res.success) {
        toast.success("Historial de ventas reiniciado a cero con éxito");
        setShowResetConfirm(false);
        window.location.reload();
      } else {
        toast.error(res.error || "No se pudo reiniciar el historial");
      }
    } catch {
      toast.error("Error al reiniciar historial");
    } finally {
      setIsResetting(false);
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
          {/* VENTA ACTUAL / TURNO EN CURSO */}
          <div className="p-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 rounded-3xl border-2 border-orange-500/40 shadow-2xl space-y-3.5 relative overflow-hidden">
            {/* Glow decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    currentShift.ordersCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                  )}
                />
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                  Venta Actual • Turno en Curso
                </span>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                {currentShift.ordersCount}{" "}
                {currentShift.ordersCount === 1 ? "pedido cobrado" : "pedidos cobrados"}
              </span>
            </div>

            <div className="relative z-10">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight block">
                {formatCurrency(currentShift.totalSales)}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {currentShift.ordersCount > 0
                  ? "Total cobrado en este turno (pendiente de cierre)"
                  : "Turno listo y en espera de nuevas ventas"}
              </span>
            </div>

            {/* Desglose Efectivo vs Transferencia en este turno */}
            <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
              <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-2xl flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block leading-none">
                    Efectivo
                  </span>
                  <span className="font-black text-emerald-400 text-sm">
                    {formatCurrency(currentShift.totalCash)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-2xl flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block leading-none">
                    Transferencia
                  </span>
                  <span className="font-black text-cyan-400 text-sm">
                    {formatCurrency(currentShift.totalTransfer)}
                  </span>
                </div>
              </div>
            </div>

            {/* Platos vendidos en este turno */}
            {currentShift.topProducts.length > 0 && (
              <div className="p-3 bg-black/40 border border-zinc-800/80 rounded-2xl space-y-1.5 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Platos y bebidas vendidos en este turno:
                </span>
                <div className="space-y-1 text-xs">
                  {currentShift.topProducts.slice(0, 5).map((p) => (
                    <div key={p.name} className="flex justify-between text-zinc-300">
                      <span className="line-clamp-1">
                        <strong className="text-orange-400">{p.quantity}x</strong> {p.name}
                      </span>
                      <span className="font-bold text-zinc-400">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOTÓN CERRAR VENTAS */}
            <button
              type="button"
              onClick={() => setIsCloseShiftModalOpen(true)}
              disabled={currentShift.ordersCount === 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-700 hover:to-orange-700 active:scale-[0.98] transition-all text-white font-black text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none relative z-10 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {currentShift.ordersCount > 0
                  ? `Cerrar Ventas de Este Turno (${formatCurrency(currentShift.totalSales)})`
                  : "Turno en Cero • Listo para Nuevas Ventas"}
              </span>
            </button>
          </div>

          {/* ÚLTIMO CIERRE REALIZADO (Si existe) */}
          {lastClosure && (
            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-3xl flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-amber-400 border border-zinc-800 flex items-center justify-center font-black shrink-0">
                  #{lastClosure.closureNumber}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    Último Cierre Oficial
                  </span>
                  <span className="font-extrabold text-white">
                    {new Date(lastClosure.closedAt).toLocaleDateString("es-EC", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    a las{" "}
                    {new Date(lastClosure.closedAt).toLocaleTimeString("es-EC", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {lastClosure.ordersCount} comandas • {formatCurrency(lastClosure.totalSales)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClosure(lastClosure)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-amber-400 border border-zinc-800 text-[11px] font-black active:scale-95 transition-transform shrink-0"
              >
                Ver Detalle
              </button>
            </div>
          )}

          {/* Tarjetas KPI Acumulado Hoy */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-1 shadow-lg">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Total Ventas Hoy
              </span>
              <span className="text-2xl font-black text-emerald-400 block tracking-tight">
                {formatCurrency(stats?.totalSalesToday ?? 0)}
              </span>
              <span className="text-[11px] font-bold text-zinc-500 block">
                {stats?.ordersCountToday ?? 0} pedidos en el día
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

          {/* Platos más Vendidos del Mes */}
          <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Platos y Bebidas Más Vendidos del Mes
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

      {/* TAB 2: HISTORIAL GENERAL & CIERRES */}
      {activeTab === "HISTORIAL" && (
        <div className="px-3.5 space-y-3.5">
          {/* Sub-Tabs: Comandas Cobradas vs Cierres de Ventas */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs font-black">
            <button
              type="button"
              onClick={() => setHistorySubTab("ORDENES")}
              className={cn(
                "py-2.5 rounded-xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5",
                historySubTab === "ORDENES"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Comandas ({filteredOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setHistorySubTab("CIERRES")}
              className={cn(
                "py-2.5 rounded-xl transition-all active:scale-95 text-center flex items-center justify-center gap-1.5",
                historySubTab === "CIERRES"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Cierres Oficiales ({filteredClosures.length})</span>
            </button>
          </div>

          {/* FILTRO DE FECHAS */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Filtrar por Fecha:</span>
              </span>
              {isLoadingFiltered && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>Cargando...</span>
                </span>
              )}
            </div>

            {/* Chips de fechas rápidas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(["HOY", "AYER", "SEMANA", "MES", "TODOS", "CUSTOM"] as const).map((r) => {
                const labels: Record<string, string> = {
                  HOY: "Hoy",
                  AYER: "Ayer",
                  SEMANA: "Últimos 7 días",
                  MES: "Este Mes",
                  TODOS: "Todo el Historial",
                  CUSTOM: "Personalizado ▾",
                };
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setDateRangeType(r);
                      if (r !== "CUSTOM") {
                        handleApplyFilter(r);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border",
                      dateRangeType === r
                        ? "bg-orange-500/20 border-orange-500 text-white font-black shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>

            {/* Selector de fechas personalizado si r === CUSTOM */}
            {dateRangeType === "CUSTOM" && (
              <div className="p-2.5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Desde:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold block mb-1">Hasta:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyFilter("CUSTOM")}
                  className="w-full py-2 rounded-xl bg-orange-500 text-white font-black text-xs active:scale-95 transition-transform"
                >
                  Aplicar Rango de Fechas
                </button>
              </div>
            )}

            {/* Filtro de Método de Pago y Buscador */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-850">
              <div>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    const val = e.target.value as "TODOS" | "EFECTIVO" | "TRANSFERENCIA";
                    setPaymentMethodFilter(val);
                    handleApplyFilter(undefined, val);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 font-bold"
                >
                  <option value="TODOS">Todos los métodos</option>
                  <option value="EFECTIVO">Solo Efectivo</option>
                  <option value="TRANSFERENCIA">Solo Transferencia</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyFilter();
                  }}
                  placeholder="Buscar comanda o mesa..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* RESUMEN ESTADÍSTICO DEL PERÍODO */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 rounded-3xl border border-emerald-500/30 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                  Resumen de Ventas del Período
                </span>
                <span className="text-2xl font-black text-white">
                  {formatCurrency(filteredSummary.totalSales)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-400 block">
                  {filteredSummary.ordersCount} comandas
                </span>
                <span className="text-[10px] text-zinc-400 font-bold">
                  Prom: {formatCurrency(filteredSummary.averageTicket)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800">
              <div className="p-2.5 bg-black/50 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold flex items-center gap-1 text-[11px]">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Efectivo:</span>
                </span>
                <span className="font-black text-emerald-400">
                  {formatCurrency(filteredSummary.totalCash)}
                </span>
              </div>
              <div className="p-2.5 bg-black/50 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold flex items-center gap-1 text-[11px]">
                  <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Transf:</span>
                </span>
                <span className="font-black text-cyan-400">
                  {formatCurrency(filteredSummary.totalTransfer)}
                </span>
              </div>
            </div>

            {/* Platos más vendidos en este período */}
            {filteredSummary.topProducts.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Platos más vendidos en este filtro:
                </span>
                <div className="space-y-1 text-xs">
                  {filteredSummary.topProducts.slice(0, 4).map((p) => (
                    <div key={p.name} className="flex justify-between text-zinc-300">
                      <span className="line-clamp-1">
                        <strong className="text-orange-400">{p.quantity}x</strong> {p.name}
                      </span>
                      <span className="font-bold text-zinc-400">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LISTA SEGÚN SUB-TAB: COMANDAS vs CIERRES */}
          {historySubTab === "ORDENES" && (
            <div className="space-y-2.5">
              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center bg-zinc-950/60 rounded-3xl border border-zinc-900 p-6">
                  <Receipt className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  <h3 className="font-bold text-zinc-300 text-sm">
                    Sin comandas en este período
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Intenta cambiar las fechas o los filtros de búsqueda.
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const paidTime = order.paidAt
                    ? new Date(order.paidAt).toLocaleTimeString("es-EC", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  const paidDate = order.paidAt
                    ? new Date(order.paidAt).toLocaleDateString("es-EC", {
                        day: "numeric",
                        month: "short",
                      })
                    : "";

                  return (
                    <div
                      key={order.id}
                      className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-sm text-white">
                              {order.customerName || order.tableNumber}
                            </h4>
                            <span className="text-[11px] font-bold text-orange-400">
                              #{order.orderNumber}
                            </span>
                            {order.closure && (
                              <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400">
                                Cierre #{order.closure.closureNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-zinc-500">
                            {paidDate} • {paidTime}
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LISTA DE CIERRES OFICIALES */}
          {historySubTab === "CIERRES" && (
            <div className="space-y-3">
              {filteredClosures.length === 0 ? (
                <div className="py-12 text-center bg-zinc-950/60 rounded-3xl border border-zinc-900 p-6">
                  <Lock className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  <h3 className="font-bold text-zinc-300 text-sm">
                    Sin cierres de ventas en este período
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Los cierres oficiales de turno aparecerán registrados aquí.
                  </p>
                </div>
              ) : (
                filteredClosures.map((closure) => {
                  let dishesCount = 0;
                  try {
                    const parsed = JSON.parse(closure.itemsSummary || "[]");
                    dishesCount = parsed.reduce((sum: number, it: any) => sum + (it.quantity || 0), 0);
                  } catch {}

                  return (
                    <div
                      key={closure.id}
                      className="p-4 bg-zinc-950 border border-zinc-800 hover:border-orange-500/40 rounded-3xl space-y-3 shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0">
                            #{closure.closureNumber}
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm">
                              Cierre de Ventas #{closure.closureNumber}
                            </h4>
                            <span className="text-[11px] text-zinc-400 font-semibold block mt-0.5">
                              {new Date(closure.closedAt).toLocaleDateString("es-EC", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              a las{" "}
                              {new Date(closure.closedAt).toLocaleTimeString("es-EC", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-amber-400 block">
                            {formatCurrency(closure.totalSales)}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500">
                            {closure.ordersCount} comandas
                          </span>
                        </div>
                      </div>

                      {/* Resumen de efectivo vs transferencia */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-850 flex items-center justify-between">
                          <span className="text-zinc-400 font-bold flex items-center gap-1">
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Efectivo:</span>
                          </span>
                          <span className="font-black text-emerald-400">
                            {formatCurrency(closure.totalCash)}
                          </span>
                        </div>
                        <div className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-850 flex items-center justify-between">
                          <span className="text-zinc-400 font-bold flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Transferencia:</span>
                          </span>
                          <span className="font-black text-cyan-400">
                            {formatCurrency(closure.totalTransfer)}
                          </span>
                        </div>
                      </div>

                      {closure.notes && (
                        <p className="text-xs text-zinc-300 italic bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-850">
                          <span className="font-bold text-zinc-400">Nota:</span> {closure.notes}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedClosure(closure)}
                        className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-amber-400 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Ver Platos Vendidos en este Cierre ({dishesCount} platos)</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* MANTENIMIENTO / REINICIO DE PRUEBAS */}
          <div className="mt-6 p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white">Mantenimiento de Pruebas</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              ¿Hiciste pruebas y quieres empezar con ventas en $0.00? Este botón borra los pedidos y cierres de prueba sin alterar tus platos ni guarniciones del menú.
            </p>

            {showResetConfirm ? (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 text-center animate-in fade-in">
                <p className="text-xs font-bold text-rose-200">
                  ¿Confirmas borrar todo el historial y volver a $0.00?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 rounded-lg bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleResetSales}
                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
                  >
                    {isResetting ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isResetting ? "Limpiando..." : "Sí, Limpiar Todo"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/50 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Reiniciar Historial de Pruebas a $0.00</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE MENÚ Y GUARNICIONES */}
      {activeTab === "MENU" && (
        <div className="px-3.5 space-y-3.5">
          {/* Sub-Tabs: Platos y Bebidas vs Guarniciones */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs font-black">
            <button
              type="button"
              onClick={() => setMenuSubTab("PRODUCTOS")}
              className={cn(
                "py-2.5 rounded-xl transition-all text-center",
                menuSubTab === "PRODUCTOS"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              🍢 Platos & Bebidas ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setMenuSubTab("GUARNICIONES")}
              className={cn(
                "py-2.5 rounded-xl transition-all text-center",
                menuSubTab === "GUARNICIONES"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              🥗 Guarniciones ({accompaniments.length})
            </button>
          </div>

          {menuSubTab === "PRODUCTOS" ? (
            <div className="space-y-3">
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

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleProduct(prod)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95",
                        prod.isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                      )}
                    >
                      {prod.isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Disponible</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Agotado</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prod)}
                      title="Editar producto"
                      className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/15 border border-zinc-800 active:scale-90 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingProductTarget(prod)}
                      title="Eliminar producto"
                      className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/15 border border-zinc-800 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Formulario para agregar nueva guarnición */}
              <form
                onSubmit={handleCreateAccompaniment}
                className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Nueva Guarnición / Combinación
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="Ej. Papa, choclo, menestra o Yuca frita"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingAcc || !newAccName.trim()}
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isCreatingAcc ? "..." : "Agregar"}</span>
                  </button>
                </div>
              </form>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  Estas opciones le aparecen al mesero en &quot;Servir con&quot;. La opción &quot;Sin guarnición (Solo pincho)&quot; siempre está disponible para clientes que no deseen acompañamiento.
                </span>
              </div>

              {/* Lista de guarniciones */}
              {accompaniments.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  No hay guarniciones registradas.
                </p>
              ) : (
                accompaniments.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <h4
                        className={cn(
                          "font-bold text-xs sm:text-sm capitalize line-clamp-1",
                          acc.isActive ? "text-white" : "text-zinc-500 line-through"
                        )}
                      >
                        {acc.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 block">
                        {acc.isActive ? "Visible para meseros" : "Oculta temporalmente"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAccompaniment(acc)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all active:scale-95",
                          acc.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                        )}
                      >
                        {acc.isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Activa</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Pausada</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAccompaniment(acc.id, acc.name)}
                        title="Eliminar guarnición"
                        className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 border border-zinc-800 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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

              {/* Foto del Producto */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  Foto del Producto (opcional):
                </label>
                {newProduct.imageUrl ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-zinc-750 bg-zinc-900 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={newProduct.imageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setNewProduct((prev) => ({ ...prev, imageUrl: "" }))}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Eliminar foto</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewProduct((prev) => ({ ...prev, imageUrl: "" }))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center border border-zinc-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-orange-500/50 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer transition-all p-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-zinc-200">Subir foto o tomar con cámara</span>
                      <p className="text-[10px] text-zinc-500">PNG, JPG o foto directa del celular</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

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

      {/* MODAL PARA EDITAR PRODUCTO DEL MENÚ */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h2 className="font-black text-white text-base">
                  Editar Plato o Bebida
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center active:scale-90 border border-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
              {/* Categoría */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Categoría:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, category: "PINCHO", hasAccompaniments: true })}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-bold border transition-all text-center",
                      editingProduct.category === "PINCHO"
                        ? "bg-orange-500/20 border-orange-500 text-orange-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400"
                    )}
                  >
                    🍢 Pincho al Carbón
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, category: "BEBIDA", hasAccompaniments: false })}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-bold border transition-all text-center",
                      editingProduct.category === "BEBIDA"
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
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Ej. Mixto Especial de Picaña o Bebida de 3L"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Precio ($ USD):</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  placeholder="Ej. 3.50"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-500 font-bold"
                />
              </div>

              {/* Subcategoría (si es bebida) */}
              {editingProduct.category === "BEBIDA" && (
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Tamaño / Presentación:</label>
                  <input
                    type="text"
                    value={editingProduct.subCategory}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subCategory: e.target.value })}
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
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Ej. Asado con carbón de leña y adobo especial"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* ¿Incluye acompañamiento? */}
              {editingProduct.category === "PINCHO" && (
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-zinc-300">¿Incluye selección de guarnición?</span>
                  <input
                    type="checkbox"
                    checked={editingProduct.hasAccompaniments}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hasAccompaniments: e.target.checked })}
                    className="w-5 h-5 accent-orange-500"
                  />
                </div>
              )}

              {/* Foto del Producto */}
              <div>
                <label className="font-bold text-zinc-300 block mb-1">
                  Foto del Producto:
                </label>
                {editingProduct.imageUrl ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-zinc-750 bg-zinc-900 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editingProduct.imageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setEditingProduct((prev) => (prev ? { ...prev, imageUrl: "" } : null))}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cambiar foto</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProduct((prev) => (prev ? { ...prev, imageUrl: "" } : null))}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center border border-zinc-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-amber-500/50 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer transition-all p-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-zinc-200">Subir nueva foto o tomar con cámara</span>
                      <p className="text-[10px] text-zinc-500">PNG, JPG o foto del celular</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] transition-all text-white font-black text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isUpdating ? "Guardando cambios..." : "Guardar Cambios"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR PRODUCTO */}
      {deletingProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-white">¿Eliminar del Menú?</h3>
            </div>
            
            <p className="text-xs text-zinc-300">
              ¿Estás seguro de que deseas eliminar permanentemente <span className="font-bold text-white">&quot;{deletingProductTarget.name}&quot;</span>? Ya no estará disponible para los meseros.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingProd}
                onClick={() => setDeletingProductTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingProd}
                onClick={handleConfirmDeleteProduct}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                {isDeletingProd ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingProd ? "Eliminando..." : "Sí, Eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CIERRE DE VENTAS DE TURNO */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Cabecera */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Cierre de Ventas / Turno</h3>
                  <span className="text-xs text-zinc-400">Finalizar turno actual y cuadrar caja</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Total Destacado */}
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                  Total a Cerrar en este Turno
                </span>
                <span className="text-3xl font-black text-amber-400">
                  {formatCurrency(currentShift.totalSales)}
                </span>
                <span className="text-xs text-zinc-400 block mt-1 font-bold">
                  {currentShift.ordersCount} comandas cobradas
                </span>
              </div>

              {/* Desglose de Pago */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-400 font-bold block text-[10px]">Efectivo en Caja</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatCurrency(currentShift.totalCash)}
                  </span>
                </div>
                <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-400 font-bold block text-[10px]">Transferencias / Deuna</span>
                  <span className="text-base font-black text-cyan-400">
                    {formatCurrency(currentShift.totalTransfer)}
                  </span>
                </div>
              </div>

              {/* Lista de Platos Vendidos en este turno */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400 block">
                  Platos y Bebidas Vendidos en este Turno:
                </span>
                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 max-h-48 overflow-y-auto">
                  {currentShift.topProducts.map((p) => (
                    <div key={p.name} className="flex justify-between items-center text-xs text-zinc-300">
                      <span>
                        <strong className="text-orange-400">{p.quantity}x</strong> {p.name}
                      </span>
                      <span className="font-black text-zinc-200">{formatCurrency(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Observaciones del Cierre (Opcional):
                </label>
                <input
                  type="text"
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Ej. Cuadre exacto, turno de la noche..."
                  className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-red-500"
                />
              </div>

              {/* Aviso explicativo */}
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
                <p>
                  ℹ️ Al confirmar el cierre, estas {currentShift.ordersCount} comandas se archivarán en el historial oficial de cierres. El panel de venta actual se reiniciará a <strong>$0.00</strong> listo para el siguiente turno.
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex gap-2">
              <button
                type="button"
                disabled={isClosingShift}
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-800 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClosingShift}
                onClick={handleExecuteCloseShift}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isClosingShift ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isClosingShift ? "Cerrando..." : "Confirmar Cierre de Ventas"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA VER DETALLE DE UN CIERRE PASADO */}
      {selectedClosure && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
          <div className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block">
                  Detalle Oficial
                </span>
                <h3 className="font-black text-white text-base">
                  Cierre de Ventas #{selectedClosure.closureNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClosure(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Resumen */}
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                  Monto Total del Cierre
                </span>
                <span className="text-3xl font-black text-amber-400">
                  {formatCurrency(selectedClosure.totalSales)}
                </span>
                <div className="mt-2 text-xs text-zinc-400 flex items-center justify-center gap-3">
                  <span>💵 Efectivo: <strong>{formatCurrency(selectedClosure.totalCash)}</strong></span>
                  <span>📱 Transf: <strong>{formatCurrency(selectedClosure.totalTransfer)}</strong></span>
                </div>
              </div>

              {/* Fechas */}
              <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-1 text-xs text-zinc-300">
                <p>
                  <strong className="text-zinc-400">Fecha de Cierre:</strong>{" "}
                  {new Date(selectedClosure.closedAt).toLocaleDateString("es-EC", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  a las{" "}
                  {new Date(selectedClosure.closedAt).toLocaleTimeString("es-EC", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  <strong className="text-zinc-400">Comandas cobradas:</strong> {selectedClosure.ordersCount} pedidos
                </p>
                {selectedClosure.notes && (
                  <p className="pt-1 text-amber-300 italic">
                    <strong className="text-zinc-400">Observación:</strong> {selectedClosure.notes}
                  </p>
                )}
              </div>

              {/* Platos vendidos */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-orange-400 block">
                  Platos y Bebidas Vendidos en este Cierre:
                </span>
                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 max-h-56 overflow-y-auto">
                  {(() => {
                    let itemsList: any[] = [];
                    try {
                      itemsList = JSON.parse(selectedClosure.itemsSummary || "[]");
                    } catch {}

                    if (itemsList.length === 0) {
                      return <p className="text-xs text-zinc-500 text-center py-2">Sin desglose de platos disponible</p>;
                    }

                    return itemsList.map((p: any) => (
                      <div key={p.name} className="flex justify-between items-center text-xs text-zinc-300">
                        <span>
                          <strong className="text-orange-400">{p.quantity}x</strong> {p.name}
                        </span>
                        <span className="font-black text-zinc-200">{formatCurrency(p.revenue)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
              <button
                type="button"
                onClick={() => setSelectedClosure(null)}
                className="w-full py-3 rounded-2xl bg-zinc-900 text-zinc-300 text-xs font-bold border border-zinc-800 active:scale-95"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
