import Link from "next/link";
import { 
  UtensilsCrossed, 
  ChefHat, 
  CircleDollarSign, 
  BarChart3, 
  Smartphone, 
  ArrowRight, 
  Sparkles
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/navigation/BottomNav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const productsCount = await prisma.product.count();
  const pendingKitchen = await prisma.order.count({
    where: { status: "PENDIENTE_COCINA" },
  });
  const pendingCashier = await prisma.order.count({
    where: { status: "DESPACHADO" },
  });

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-4 py-6 pb-28 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header móvil principal con Logo Oficial */}
      <header className="text-center mb-6 pt-2">
        <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full shadow-2xl fire-glow mb-3 p-1 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 border border-amber-400/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Logo Pinchería La Última Oportunidad"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
          Pinchería La Última Oportunidad
        </h1>
        <p className="text-xs font-bold text-amber-400 mt-1 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span>Parrilla al Carbón • Comandas & Facturación Móvil</span>
        </p>

        {/* Status en vivo */}
        <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sistema en línea ({productsCount} productos en carta)</span>
        </div>
      </header>

      {/* Módulos Operativos Táctiles */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-1">
          Módulos Móviles del Restaurante
        </h2>

        {/* 1. Mesero */}
        <Link
          href="/mesero"
          className="group block p-4 bg-zinc-950 rounded-3xl border border-zinc-800 hover:border-orange-500/60 shadow-xl shadow-black/60 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white text-base">Toma de Pedidos (Mesero)</h3>
                <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                Catálogo visual con fotos de pinchos, 4 guarniciones a 1 toque y carrito
              </p>
            </div>
          </div>
        </Link>

        {/* 2. Cocina KDS */}
        <Link
          href="/cocina"
          className="group block p-4 bg-zinc-950 rounded-3xl border border-zinc-800 hover:border-amber-500/60 shadow-xl shadow-black/60 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base">Cocina & Asador (KDS)</h3>
                  {pendingKitchen > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px]">
                      {pendingKitchen} en fuego
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                Cola cronológica de comandas, detalle de guarnición y despacho
              </p>
            </div>
          </div>
        </Link>

        {/* 3. Caja / Cobro */}
        <Link
          href="/caja"
          className="group block p-4 bg-zinc-950 rounded-3xl border border-zinc-800 hover:border-emerald-500/60 shadow-xl shadow-black/60 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <CircleDollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base">Caja & Facturación</h3>
                  {pendingCashier > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-black text-[10px]">
                      {pendingCashier} por cobrar
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                Efectivo con cálculo de vuelto o Transferencia con foto de comprobante
              </p>
            </div>
          </div>
        </Link>

        {/* 4. Panel Admin */}
        <Link
          href="/admin"
          className="group block p-4 bg-zinc-950 rounded-3xl border border-zinc-800 hover:border-zinc-700 shadow-xl shadow-black/60 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white text-base">Ventas & Menú</h3>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                Ventas del día, mes, métricas y agregar platos nuevos a la carta
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Footer táctil */}
      <footer className="mt-6 p-4 bg-zinc-950/80 rounded-3xl border border-zinc-900 flex items-start gap-3 text-zinc-400 text-xs shadow-lg">
        <Smartphone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">Diseño Táctil para Celular</p>
          <p className="mt-0.5 leading-relaxed text-zinc-400">
            Optimizado para uso rápido con una sola mano desde el celular del mesero, pantalla en cocina o teléfono en caja.
          </p>
        </div>
      </footer>

      <BottomNav />
    </main>
  );
}
