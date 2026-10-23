import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pinchos Express - Sistema de Pedidos",
  description: "Sistema móvil para restaurante de pinchos (Mesero, Cocina, Caja)",
  applicationName: "Pinchos Express",
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
  themeColor: "#f97316", // Naranja cálido (tono asador / pinchos)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-slate-50 antialiased selection:bg-orange-500 selection:text-white">
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
