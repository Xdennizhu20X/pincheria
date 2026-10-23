import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pinchería La Última Oportunidad - Sistema Móvil",
  description: "Sistema móvil de pedidos para Pinchería La Última Oportunidad (Mesero, Cocina, Caja, Admin)",
  applicationName: "La Última Oportunidad",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "La Última Oportunidad",
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
      className="h-full bg-black antialiased selection:bg-orange-500 selection:text-white"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans text-zinc-100 bg-black"
        suppressHydrationWarning
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
