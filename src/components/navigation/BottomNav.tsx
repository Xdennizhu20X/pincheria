"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ChefHat, CircleDollarSign, BarChart3, Home, Flame } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 pb-[env(safe-area-inset-bottom)] max-w-md mx-auto sm:max-w-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-bold transition-all duration-200 active:scale-90",
                isActive
                  ? "text-orange-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50" />
              )}
              <div
                className={cn(
                  "p-1.5 rounded-2xl transition-all",
                  isActive
                    ? "bg-gradient-to-br from-orange-500/20 to-red-500/10 text-orange-400 border border-orange-500/30 shadow-md shadow-orange-500/20"
                    : "text-zinc-500"
                )}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="leading-none text-[10px] font-extrabold tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
