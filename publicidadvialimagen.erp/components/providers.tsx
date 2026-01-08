"use client"

import { ThemeProvider } from "./theme-provider"
import { PermisosProvider } from "@/hooks/permisos-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PermisosProvider>
          {children}
        </PermisosProvider>
      </ThemeProvider>
    </div>
  )
}
