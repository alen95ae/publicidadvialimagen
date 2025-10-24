"use client"

import { CampaignsProvider } from "./campaigns-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CampaignsProvider>
      {children}
    </CampaignsProvider>
  )
}
