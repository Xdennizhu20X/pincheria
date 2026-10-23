"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ChefHat, CircleDollarSign, BarChart3, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/mesero", label: "Mesero", icon: UtensilsCrossed },
  { href: "/cocina", label: "Cocina", icon: ChefHat },
  { href: "/caja", label: "Caja", icon: CircleDollarSign },
  { href: "/admin", label: "Ventas", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom)] max-w-lg mx-auto">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-semibold transition-all duration-150 active:scale-95",
                isActive
                  ? "text-orange-500"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive ? "bg-orange-500/15 text-orange-500" : "text-slate-400"
                )}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
