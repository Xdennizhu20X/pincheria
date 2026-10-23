import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pinchos El Paisa - Sistema Móvil",
  description: "Sistema móvil de pedidos para restaurante de pinchos (Mesero, Cocina, Caja, Admin)",
  applicationName: "Pinchos El Paisa",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pinchos",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full bg-slate-950 antialiased selection:bg-orange-500 selection:text-white"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans text-slate-100 bg-slate-950"
        suppressHydrationWarning
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
