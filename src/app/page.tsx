import Link from "next/link";
import { UtensilsCrossed, ChefHat, CircleDollarSign, BarChart3, Smartphone, ArrowRight, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const productsCount = await prisma.product.count();

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-slate-50 to-slate-100 px-4 py-6 max-w-md mx-auto sm:max-w-lg md:max-w-xl">
      {/* Header móvil */}
      <header className="text-center mb-6 pt-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 mb-3">
          <Flame className="w-9 h-9 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Pinchos El Paisa
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Sistema Móvil de Gestión & Comandas
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Base de datos activa ({productsCount} productos en menú)</span>
        </div>
      </header>

      {/* Módulos de Acceso Rápido (Mobile First) */}
      <section className="space-y-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Módulos Operativos (Vistas Móviles)
        </h2>

        {/* 1. Mesero */}
        <Link
          href="/mesero"
          className="group block p-4 bg-white rounded-2xl border-2 border-orange-200/80 shadow-sm active:scale-[0.98] transition-all hover:border-orange-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Toma de Pedidos (Mesero)</h3>
                <ArrowRight className="w-4 h-4 text-orange-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                Catálogo visual, selección de guarnición y envío directo a cocina
              </p>
            </div>
          </div>
        </Link>

        {/* 2. Cocina KDS */}
        <Link
          href="/cocina"
          className="group block p-4 bg-white rounded-2xl border-2 border-amber-200/80 shadow-sm active:scale-[0.98] transition-all hover:border-amber-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ChefHat className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Pantalla de Cocina (KDS)</h3>
                <ArrowRight className="w-4 h-4 text-amber-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                Cola cronológica de comandas, detalle de asador y botón despachar
              </p>
            </div>
          </div>
        </Link>

        {/* 3. Caja / Cobro */}
        <Link
          href="/caja"
          className="group block p-4 bg-white rounded-2xl border-2 border-emerald-200/80 shadow-sm active:scale-[0.98] transition-all hover:border-emerald-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Caja y Cobro</h3>
                <ArrowRight className="w-4 h-4 text-emerald-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                Pedidos listos por cobrar, cálculo de vuelto y pase al historial
              </p>
            </div>
          </div>
        </Link>

        {/* 4. Panel Admin */}
        <Link
          href="/admin"
          className="group block p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm active:scale-[0.98] transition-all hover:border-slate-400 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Reportes y Menú</h3>
                <ArrowRight className="w-4 h-4 text-slate-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                Ventas del día, mes, métricas de pinchos y gestión de precios
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Indicador Mobile-First */}
      <footer className="mt-8 p-3.5 bg-orange-100/60 rounded-xl border border-orange-200/60 flex items-start gap-3 text-orange-950 text-xs">
        <Smartphone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Diseño 100% Mobile-First</p>
          <p className="text-orange-900/80 mt-0.5">
            Optimizado con áreas táctiles amplias, sin doble tap zoom y accesible directamente desde el navegador de cualquier celular.
          </p>
        </div>
      </footer>
    </main>
  );
}
