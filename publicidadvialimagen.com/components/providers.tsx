"use client"

import { CampaignsProvider } from "./campaigns-provider"
import { TranslationProvider } from "./translation-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      <CampaignsProvider>
        {children}
      </CampaignsProvider>
    </TranslationProvider>
  )
}
