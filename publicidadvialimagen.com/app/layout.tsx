import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/leaflet.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { CampaignsProvider } from "@/components/campaigns-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Publicidad Vial Imagen | Vallas Publicitarias",
  description: "Espacios publicitarios premium y servicios de impresión profesional para potenciar tu marca",
  generator: 'v0.app',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CampaignsProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </CampaignsProvider>
      </body>
    </html>
  )
}
