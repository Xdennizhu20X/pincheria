"use client";

import React, { useState, useRef } from "react";
import { Plus, Flame, GlassWater, Sparkles, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { formatCurrency, cn } from "@/lib/utils";
import { AccompanimentModal } from "./AccompanimentModal";
import { CartDrawer, CartItem } from "./CartDrawer";
import { BottomNav } from "@/components/navigation/BottomNav";

interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  price: number;
  description: string | null;
  hasAccompaniments: boolean;
  sortOrder: number;
}

interface WaiterViewProps {
  products: Product[];
}

export function WaiterView({ products }: WaiterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"PINCHO" | "BEBIDA">("PINCHO");
  const [selectedDrinkSize, setSelectedDrinkSize] = useState<string>("TODAS");
  const [tableNumber, setTableNumber] = useState<string>("Mesa 1");
  const [customerName, setCustomerName] = useState<string>("");
  
  // Carrito de compras del mesero
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Modal de guarnición/acompañamiento para pinchos
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Filtrado de productos
  const pinchos = products.filter((p) => p.category === "PINCHO");
  const bebidas = products.filter((p) => p.category === "BEBIDA");

  const displayedBebidas = bebidas.filter((b) => {
    if (selectedDrinkSize === "TODAS") return true;
    return b.subCategory === selectedDrinkSize;
  });

  const handleProductClick = (prod: Product) => {
    if (prod.hasAccompaniments) {
      setModalProduct(prod);
    } else {
      // Bebidas se agregan con 1 toque
      handleAddDrinkToCart(prod);
    }
  };

  const handleAddDrinkToCart = (prod: Product) => {
    const existingIndex = cartItems.findIndex(
      (it) => it.productId === prod.id && !it.accompaniment
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          tempId: `${prod.id}-${Date.now()}`,
          productId: prod.id,
          productName: prod.name,
          unitPrice: prod.price,
          quantity: 1,
        },
      ]);
    }

    toast.success(`+1 ${prod.name}`, {
      duration: 1500,
    });
  };

  const handleConfirmAccompaniment = (accompaniment: string, notes: string) => {
    if (!modalProduct) return;

    // Buscar si ya existe el mismo pincho con el MISMO acompañamiento y nota
    const existingIndex = cartItems.findIndex(
      (it) =>
        it.productId === modalProduct.id &&
        it.accompaniment === accompaniment &&
        it.notes === (notes.trim() || undefined)
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          tempId: `${modalProduct.id}-${Date.now()}`,
          productId: modalProduct.id,
          productName: modalProduct.name,
          unitPrice: modalProduct.price,
          quantity: 1,
          accompaniment,
          notes: notes.trim() || undefined,
        },
      ]);
    }

    toast.success(`+1 ${modalProduct.name}`, {
      description: `Con: ${accompaniment}`,
      duration: 2000,
    });
  };

  const handleUpdateQuantity = (tempId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.tempId === tempId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (tempId: string) => {
    setCartItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCustomerName("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-36 max-w-md mx-auto sm:max-w-lg">
      {/* Header Fijo Móvil */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-black">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-slate-100 text-base leading-tight">
              Toma de Pedido
            </h1>
            <p className="text-[11px] font-semibold text-orange-400">
              Mesero en mesa: <span className="underline">{tableNumber}</span>
            </p>
          </div>
        </div>

        {/* Indicador de mesa rápida */}
        <div className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
          {tableNumber}
        </div>
      </header>

      {/* Selector de Categorías (Tabs grandes táctiles) */}
      <div className="p-3.5">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedCategory("PINCHO")}
            className={cn(
              "py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95",
              selectedCategory === "PINCHO"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Flame className="w-4 h-4" />
            <span>Pinchos ({pinchos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("BEBIDA")}
            className={cn(
              "py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95",
              selectedCategory === "BEBIDA"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            )}
          >
            <GlassWater className="w-4 h-4" />
            <span>Bebidas ({bebidas.length})</span>
          </button>
        </div>

        {/* Subcategorías de bebidas si está en Bebidas */}
        {selectedCategory === "BEBIDA" && (
          <div className="flex items-center gap-1.5 overflow-x-auto mt-2.5 pb-1 scrollbar-none">
            {["TODAS", "Personal", "1 Litro", "1.25 Litros", "2 Litros"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedDrinkSize(size)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 shrink-0",
                  selectedDrinkSize === size
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                {size === "TODAS" ? "Todos los tamaños" : size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Productos del Menú */}
      <div className="px-3.5 space-y-2.5">
        {selectedCategory === "PINCHO" ? (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pinchos al Carbón
              </span>
              <span className="text-[11px] text-orange-400 font-medium">
                Toca para elegir guarnición
              </span>
            </div>

            {pinchos.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleProductClick(prod)}
                className="w-full text-left p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex items-center gap-3.5 transition-all active:scale-[0.98] shadow-sm group hover:border-orange-500/50"
              >
                <ProductIcon name={prod.name} category={prod.category} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-snug group-hover:text-orange-400 transition-colors">
                      {prod.name}
                    </h3>
                    <span className="font-black text-orange-400 text-sm sm:text-base shrink-0">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {prod.description || "Asado con acompañamiento"}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>Incluye 4 opciones de guarnición</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            ))}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bebidas Frías
              </span>
              <span className="text-[11px] text-cyan-400 font-medium">
                Toca para agregar directo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {displayedBebidas.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleProductClick(prod)}
                  className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl flex flex-col justify-between text-left transition-all active:scale-[0.97] group hover:border-cyan-500/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <ProductIcon name={prod.name} category={prod.category} size="sm" />
                    <span className="font-black text-cyan-400 text-sm">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="font-bold text-slate-100 text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {prod.subCategory}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>Agregar</span>
                    <Plus className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-125 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Acompañamiento */}
      <AccompanimentModal
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        product={modalProduct}
        onConfirm={handleConfirmAccompaniment}
      />

      {/* Carrito Flotante */}
      <CartDrawer
        items={cartItems}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        customerName={customerName}
        setCustomerName={setCustomerName}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Barra de navegación inferior */}
      <BottomNav />
    </div>
  );
}
