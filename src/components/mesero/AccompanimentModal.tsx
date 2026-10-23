"use client";

import React, { useState } from "react";
import { Check, X, Sparkles, MessageSquare } from "lucide-react";
import { ACCOMPANIMENT_OPTIONS, AccompanimentOption } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import { ProductIcon } from "@/components/ui/ProductIcon";

interface AccompanimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
  } | null;
  onConfirm: (accompaniment: string, notes: string) => void;
}

export function AccompanimentModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: AccompanimentModalProps) {
  const [selectedAcc, setSelectedAcc] = useState<AccompanimentOption>(
    ACCOMPANIMENT_OPTIONS[0]
  );
  const [notes, setNotes] = useState("");

  if (!isOpen || !product) return null;

  const handleSelect = (option: AccompanimentOption) => {
    setSelectedAcc(option);
  };

  const handleConfirm = () => {
    onConfirm(selectedAcc, notes);
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div 
        className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200"
      >
        {/* Cabecera del Bottom Sheet */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductIcon name={product.name} category={product.category} size="sm" />
            <div>
              <h3 className="font-bold text-slate-100 text-base leading-tight">
                {product.name}
              </h3>
              <p className="text-orange-400 font-bold text-sm">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido seleccionable */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Selecciona cómo servir:
              </span>
              <span className="text-[11px] text-slate-400">Obligatorio (1 opción)</span>
            </div>

            <div className="space-y-2">
              {ACCOMPANIMENT_OPTIONS.map((opt) => {
                const isSelected = selectedAcc === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between active:scale-[0.98]",
                      isSelected
                        ? "bg-orange-500/15 border-orange-500 text-white shadow-sm shadow-orange-500/20"
                        : "bg-slate-800/80 border-slate-700/70 text-slate-300 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          isSelected
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-500"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-semibold capitalize">
                        {opt}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nota opcional */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Instrucción especial (Opcional):</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Bien asado, sin ají, término medio..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500"
            />
          </div>
        </div>

        {/* Botón de Confirmación Flotante en el Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-[0.97] transition-all text-white font-bold text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Agregar al Pedido ({formatCurrency(product.price)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
