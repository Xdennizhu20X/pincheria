"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Flame, 
  GlassWater, 
  Sparkles, 
  UtensilsCrossed, 
  Search,
  Clock,
  Table2
} from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ui/ProductImage";
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
  imageUrl: string | null;
  hasAccompaniments: boolean;
  sortOrder: number;
}

interface WaiterViewProps {
  products: Product[];
}

export function WaiterView({ products }: WaiterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"TODOS" | "PINCHO" | "BEBIDA">("PINCHO");
  const [selectedDrinkSize, setSelectedDrinkSize] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableNumber, setTableNumber] = useState<string>("Mesa 1");
  const [customerName, setCustomerName] = useState<string>("");
  
  // Carrito de compras
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Modal de guarnición para pinchos
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Filtrado de productos
  const filteredProducts = products.filter((prod) => {
    // Categoría
    if (selectedCategory !== "TODOS" && prod.category !== selectedCategory) {
      return false;
    }
    // Subcategoría de bebidas
    if (selectedCategory === "BEBIDA" && selectedDrinkSize !== "TODAS") {
      if (prod.subCategory !== selectedDrinkSize) return false;
    }
    // Buscador
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        prod.name.toLowerCase().includes(q) ||
        (prod.description && prod.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleProductClick = (prod: Product) => {
    if (prod.hasAccompaniments) {
      setModalProduct(prod);
    } else {
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
          imageUrl: prod.imageUrl,
        },
      ]);
    }

    toast.success(`+1 ${prod.name}`, {
      duration: 1500,
    });
  };

  const handleConfirmAccompaniment = (accompaniment: string, notes: string) => {
    if (!modalProduct) return;

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
          imageUrl: modalProduct.imageUrl,
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
    <div className="min-h-screen bg-black text-zinc-100 pb-36 max-w-md mx-auto sm:max-w-lg">
      {/* Header Fijo Móvil (Estilo Oscuro con Detalles de Fuego) */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black text-white text-base leading-tight tracking-tight">
              Pinchos El Paisa
            </h1>
            <p className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
              <span>Atendiendo:</span>
              <span className="text-white underline">{tableNumber}</span>
            </p>
          </div>
        </div>

        {/* Selector rápido de mesa en el header */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-black text-amber-400">
          <Table2 className="w-3.5 h-3.5 text-orange-400" />
          <span>{tableNumber}</span>
        </div>
      </header>

      {/* Buscador y Filtros Rápidos */}
      <div className="p-3.5 space-y-3">
        {/* Input Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pinchos, bebidas, sabor..."
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Categorías Principales (Chips de Fuego) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("PINCHO")}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 shrink-0 border",
              selectedCategory === "PINCHO"
                ? "bg-gradient-to-r from-orange-500 to-red-600 border-orange-400 text-white shadow-lg shadow-orange-500/25"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>🍢 Pinchos al Carbón</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("BEBIDA")}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 shrink-0 border",
              selectedCategory === "BEBIDA"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-blue-500/25"
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
              "px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all active:scale-95 shrink-0 border",
              selectedCategory === "TODOS"
                ? "bg-zinc-100 border-white text-zinc-950 font-black"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            Ver Todo
          </button>
        </div>

        {/* Subcategorías de bebidas */}
        {selectedCategory === "BEBIDA" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none animate-in fade-in duration-200">
            {["TODAS", "Personal", "1 Litro", "1.25 Litros", "2 Litros"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedDrinkSize(size)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 shrink-0",
                  selectedDrinkSize === size
                    ? "bg-cyan-500 text-white font-black shadow-sm"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {size === "TODAS" ? "Todos los tamaños" : size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cuadrícula de Productos en 2 Columnas (Inspirada en la Referencia) */}
      <div className="px-3.5">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleProductClick(prod)}
              className="group bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/90 hover:border-orange-500/50 rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg shadow-black/40 transition-all duration-200 active:scale-[0.97] cursor-pointer"
            >
              {/* Imagen del Producto con Iluminación de Fuego */}
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-950">
                <ProductImage
                  src={prod.imageUrl}
                  alt={prod.name}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Badge flotante sobre la imagen */}
                <div className="absolute top-2 left-2 z-10">
                  {prod.category === "PINCHO" ? (
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black text-amber-300 border border-orange-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>Al carbón</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black text-cyan-300 border border-cyan-500/30">
                      {prod.subCategory}
                    </span>
                  )}
                </div>
              </div>

              {/* Información y Precio */}
              <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                <div>
                  <h3 className="font-black text-white text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-orange-400 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 font-medium">
                    {prod.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase block leading-none">
                      Precio
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-400 tracking-tight">
                      {formatCurrency(prod.price)}
                    </span>
                  </div>

                  {/* Botón circular "+" con efecto de fuego */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(prod);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-md",
                      prod.category === "PINCHO"
                        ? "bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/30 hover:shadow-orange-500/50"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-blue-500/30"
                    )}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Acompañamiento */}
      <AccompanimentModal
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        product={modalProduct}
        onConfirm={handleConfirmAccompaniment}
      />

      {/* Carrito Flotante de la Comanda */}
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
