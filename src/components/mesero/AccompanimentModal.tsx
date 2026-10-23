"use client";

import React, { useState } from "react";
import { Check, X, Flame, Sparkles, MessageSquare, Clock } from "lucide-react";
import { ACCOMPANIMENT_OPTIONS, AccompanimentOption } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";

interface AccompanimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null;
  accompaniments?: { id: string; name: string; isActive?: boolean }[];
  onConfirm: (accompaniment: string, notes: string) => void;
}

export function AccompanimentModal({
  isOpen,
  onClose,
  product,
  accompaniments,
  onConfirm,
}: AccompanimentModalProps) {
  const options = React.useMemo(() => {
    const list =
      accompaniments && accompaniments.length > 0
        ? accompaniments.filter((a) => a.isActive !== false).map((a) => a.name)
        : [...ACCOMPANIMENT_OPTIONS];

    const hasNone = list.some(
      (n) =>
        n.toLowerCase().includes("sin guarnición") ||
        n.toLowerCase().includes("sin acompañamiento")
    );
    if (!hasNone) {
      list.push("Sin guarnición (Solo pincho)");
    }
    return list;
  }, [accompaniments]);

  const [selectedAcc, setSelectedAcc] = useState<string>(options[0] || "Sin guarnición (Solo pincho)");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (options.length > 0 && !options.includes(selectedAcc)) {
      setSelectedAcc(options[0]);
    }
  }, [options, selectedAcc]);

  if (!isOpen || !product) return null;

  const handleSelect = (option: string) => {
    setSelectedAcc(option);
  };

  const handleConfirm = () => {
    onConfirm(selectedAcc, notes);
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
      <div 
        className="w-full max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200"
      >
        {/* Cabecera visual con Imagen de Fuego */}
        <div className="relative h-56 w-full bg-zinc-900 overflow-hidden shrink-0">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
          
          {/* Degradado oscuro para que los textos resalten */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white flex items-center justify-center active:scale-90 transition-transform border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge de tiempo en asador */}
          <div className="absolute top-3.5 left-3.5 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-orange-500/30 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Al Carbón • 8-12 min</span>
          </div>

          {/* Título y Precio sobre la imagen */}
          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block mb-0.5">
              Pincho Especial al Carbón
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-black text-white text-xl leading-tight drop-shadow-md">
                {product.name}
              </h3>
              <span className="text-2xl font-black text-amber-400 drop-shadow-md">
                {formatCurrency(product.price)}
              </span>
            </div>
            {product.description && (
              <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Opciones de Acompañamiento ("Servir con") */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>¿Cómo servir la porción?</span>
              </span>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                1 Opción obligatoria
              </span>
            </div>

            <div className="space-y-2">
              {options.map((opt) => {
                const isSelected = selectedAcc === opt;
                const isSinGuarnicion = opt.toLowerCase().includes("sin guarnición") || opt.toLowerCase().includes("sin acompañamiento");
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98]",
                      isSelected
                        ? "bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-zinc-900 border-orange-500 text-white shadow-lg shadow-orange-500/10"
                        : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm"
                            : "border-zinc-600 bg-zinc-950"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={cn("text-xs sm:text-sm font-bold capitalize", isSinGuarnicion && "text-zinc-400 italic")}>
                        {opt}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nota especial */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
              <span>Instrucción al asador (Opcional):</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Bien asado, sin ají, con mayonesa aparte..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-orange-500"
            />
          </div>
        </div>

        {/* Botón de Confirmación Flotante */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-red-600 hover:from-orange-600 hover:to-red-700 active:scale-[0.98] transition-all text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Agregar a la Comanda ({formatCurrency(product.price)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
