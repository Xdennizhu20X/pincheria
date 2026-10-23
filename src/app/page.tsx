import Link from "next/link";
import { 
  UtensilsCrossed, 
  ChefHat, 
  CircleDollarSign, 
  BarChart3, 
  Smartphone, 
  ArrowRight, 
  Flame,
  Clock,
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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-6 pb-28 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header móvil principal */}
      <header className="text-center mb-6 pt-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/25 mb-3 border border-orange-400/30">
          <Flame className="w-8 h-8 animate-pulse text-amber-200" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Pinchos El Paisa
        </h1>
        <p className="text-xs font-semibold text-orange-400 mt-1">
          Sistema Móvil • Comandas & Facturación
        </p>

        {/* Status en vivo */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sistema en línea ({productsCount} productos)</span>
        </div>
      </header>

      {/* Módulos Operativos (Tarjetas Táctiles Móviles) */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
          Módulos Rápidos (Acceso Móvil)
        </h2>

        {/* 1. Mesero */}
        <Link
          href="/mesero"
          className="group block p-4 bg-slate-900/90 rounded-3xl border-2 border-orange-500/40 shadow-lg shadow-orange-950/20 active:scale-[0.98] transition-all hover:border-orange-500"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-white text-base">Toma de Pedidos (Mesero)</h3>
                <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Catálogo con iconos, 4 guarniciones a 1 toque y carrito
              </p>
            </div>
          </div>
        </Link>

        {/* 2. Cocina KDS */}
        <Link
          href="/cocina"
          className="group block p-4 bg-slate-900/90 rounded-3xl border-2 border-amber-500/40 shadow-lg shadow-amber-950/20 active:scale-[0.98] transition-all hover:border-amber-500"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ChefHat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">Cocina & Asador (KDS)</h3>
                  {pendingKitchen > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                      {pendingKitchen}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Cola en orden de llegada, timer de espera y botón despachar
              </p>
            </div>
          </div>
        </Link>

        {/* 3. Caja / Cobro */}
        <Link
          href="/caja"
          className="group block p-4 bg-slate-900/90 rounded-3xl border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all hover:border-emerald-500"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CircleDollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">Caja y Cobro</h3>
                  {pendingCashier > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                      {pendingCashier}
                    </span>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Cálculo de vuelto automático y pase al historial
              </p>
            </div>
          </div>
        </Link>

        {/* 4. Panel Admin */}
        <Link
          href="/admin"
          className="group block p-4 bg-slate-900/90 rounded-3xl border-2 border-slate-800 shadow-lg active:scale-[0.98] transition-all hover:border-slate-600"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-slate-700 group-hover:text-white transition-colors">
              <BarChart3 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-white text-base">Ventas & Menú</h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                Ventas del día, mes, platos top y pausar productos agotados
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Nota Mobile-First */}
      <footer className="mt-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-start gap-3 text-slate-400 text-xs">
        <Smartphone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-200">Experiencia Móvil Táctil</p>
          <p className="mt-0.5 leading-relaxed text-slate-400">
            Diseñado para usarse con una sola mano desde el celular del mesero, pantalla en cocina o teléfono en caja.
          </p>
        </div>
      </footer>

      {/* Barra de navegación inferior */}
      <BottomNav />
    </main>
  );
}
