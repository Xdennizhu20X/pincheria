import React from "react";
import { 
  Flame, 
  Beef, 
  Sparkles, 
  GlassWater, 
  Coffee, 
  Drumstick,
  Citrus,
  Layers,
  Wine
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductIconProps {
  name: string;
  category: string;
  subCategory?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProductIcon({ name, category, subCategory, className, size = "md" }: ProductIconProps) {
  const lower = name.toLowerCase();

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg text-sm",
    md: "w-12 h-12 rounded-xl text-base",
    lg: "w-16 h-16 rounded-2xl text-xl",
  }[size];

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  // Identificar estilo de Pincho
  if (category === "PINCHO") {
    if (lower.includes("costilla")) {
      return (
        <div className={cn("flex items-center justify-center bg-gradient-to-br from-amber-600 to-rose-700 text-white shadow-md shadow-rose-900/20 shrink-0", sizeClasses, className)}>
          <Flame className={cn(iconSizeClasses, "text-amber-200 animate-pulse")} />
        </div>
      );
    }
    if (lower.includes("pollo")) {
      return (
        <div className={cn("flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-900/20 shrink-0", sizeClasses, className)}>
          <Drumstick className={iconSizeClasses} />
        </div>
      );
    }
    if (lower.includes("res")) {
      return (
        <div className={cn("flex items-center justify-center bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-md shadow-red-900/20 shrink-0", sizeClasses, className)}>
          <Beef className={iconSizeClasses} />
        </div>
      );
    }
    if (lower.includes("higadilla")) {
      return (
        <div className={cn("flex items-center justify-center bg-gradient-to-br from-amber-700 to-stone-800 text-amber-200 shadow-md shadow-stone-900/20 shrink-0", sizeClasses, className)}>
          <Layers className={iconSizeClasses} />
        </div>
      );
    }
    // Cerdo u otro mixto
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-700 text-white shadow-md shadow-orange-900/20 shrink-0", sizeClasses, className)}>
        <Flame className={iconSizeClasses} />
      </div>
    );
  }

  // Identificar Bebidas por marca
  if (lower.includes("coca cola") || lower.includes("coca-cola")) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 text-white shadow-md shadow-red-900/30 shrink-0 font-black", sizeClasses, className)}>
        <GlassWater className={iconSizeClasses} />
      </div>
    );
  }

  if (lower.includes("fanta")) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-900/30 shrink-0 font-black", sizeClasses, className)}>
        <Citrus className={iconSizeClasses} />
      </div>
    );
  }

  if (lower.includes("fioravanti") || lower.includes("fiora")) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-pink-900/30 shrink-0 font-black", sizeClasses, className)}>
        <Sparkles className={iconSizeClasses} />
      </div>
    );
  }

  if (lower.includes("sprite")) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/30 shrink-0 font-black", sizeClasses, className)}>
        <GlassWater className={iconSizeClasses} />
      </div>
    );
  }

  // Genérico
  return (
    <div className={cn("flex items-center justify-center bg-slate-800 text-slate-300 shrink-0", sizeClasses, className)}>
      <Coffee className={iconSizeClasses} />
    </div>
  );
}
