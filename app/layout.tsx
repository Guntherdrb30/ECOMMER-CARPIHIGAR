import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Inter } from "next/font/google";
import { getSettings } from "@/server/actions/settings";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Carpihogar.ai - Muebles y artículos para tu hogar",
  description: "Encuentra los mejores muebles, decoración y artículos para tu hogar en Carpihogar.ai. Calidad y buen precio en un solo lugar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  return (
    <html lang="es">
      <body
        className={`${inter.className} bg-gray-50 text-gray-800 antialiased`}
        style={{ ["--color-brand" as any]: (settings as any).primaryColor || "#FF4D00", ["--color-secondary" as any]: (settings as any).secondaryColor || "#111827" }}
      >
        <Providers>
          <Header logoUrl={(settings as any).logoUrl || undefined} brandName={(settings as any).brandName || undefined} />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster richColors />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}