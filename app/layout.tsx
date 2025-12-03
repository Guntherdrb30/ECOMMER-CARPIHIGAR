import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Inter } from "next/font/google";
import { getSettings } from "@/server/actions/settings";
import Providers from "@/components/providers";
import CookieConsent from "@/components/cookie-consent";
import AssistantRoot from "@/components/Assistant/AssistantRoot";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";

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
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://carpihogar.com';
  const initialConsent = (() => {
    try {
      const v = cookies().get('cookie_consent')?.value || null;
      return v === 'all' || v === 'necessary' ? (v as any) : null;
    } catch { return null; }
  })();

  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        'name': (settings as any).brandName || 'Carpihogar',
        'url': baseUrl,
        'logo': `${baseUrl}${(settings as any).logoUrl || '/logo-default.svg'}`,
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': (settings as any).contactPhone || '',
          'contactType': 'Customer Service',
        },
      },
      {
        '@type': 'WebSite',
        'url': baseUrl,
        'name': (settings as any).brandName || 'Carpihogar',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${baseUrl}/productos?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="es">
      <body
        className={`${inter.className} bg-gray-50 text-gray-800 antialiased`}
        style={{ ["--color-brand" as any]: (settings as any).primaryColor || "#FF4D00", ["--color-secondary" as any]: (settings as any).secondaryColor || "#111827" }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <Providers>
          <Header logoUrl={(settings as any).logoUrl || undefined} brandName={(settings as any).brandName || undefined} />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster richColors />
          <Footer
            brandName={(settings as any).brandName || undefined}
            contactEmail={(settings as any).contactEmail || 'root@carpihogar.com'}
            contactPhone={(settings as any).contactPhone || undefined}
            whatsappPhone={(settings as any).whatsappPhone || undefined}
            supportHours={(settings as any).supportHours || undefined}
          />
          <CookieConsent initialConsent={initialConsent} />
          <AssistantRoot />
          {/* Analítica de Vercel: solo recolecta datos agregados de uso */}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
