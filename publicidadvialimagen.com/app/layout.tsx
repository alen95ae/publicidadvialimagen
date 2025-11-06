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
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Publicidad Vial Imagen",
    description: "Tu plataforma inteligente de publicidad exterior",
    images: [
      {
        url: "/logo-publicidad-vial.svg",
        width: 1200,
        height: 630,
        alt: "Publicidad Vial Imagen",
      },
    ],
    url: "https://publicidadvialimagen.vercel.app",
    siteName: "Publicidad Vial Imagen",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Publicidad Vial Imagen",
    description: "Tu plataforma inteligente de publicidad exterior",
    images: ["/logo-publicidad-vial.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        {/* Google Analytics 4 */}
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
        
      </head>
      <body className={inter.className}>
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
