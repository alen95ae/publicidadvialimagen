import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Publicidad Vial Imagen | Vallas Publicitarias",
  description: "Espacios publicitarios premium y servicios de impresión profesional para potenciar tu marca - Multilingual support ES/EN",
  generator: 'v0.app',
  openGraph: {
    title: "Publicidad Vial Imagen | Vallas Publicitarias",
    description: "Espacios publicitarios premium y servicios de impresión profesional para potenciar tu marca",
    url: 'https://publicidadvialimagen.com',
    siteName: 'Publicidad Vial Imagen',
    images: [
      {
        url: 'https://publicidadvialimagen.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Publicidad Vial Imagen',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Publicidad Vial Imagen | Vallas Publicitarias",
    description: "Espacios publicitarios premium y servicios de impresión profesional para potenciar tu marca",
    images: ['https://publicidadvialimagen.com/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-891H449FXK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-891H449FXK', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
