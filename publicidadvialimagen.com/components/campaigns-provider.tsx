"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { CampaignItem } from "@/hooks/use-campaigns"

interface CampaignsContextType {
  campaigns: CampaignItem[]
  addToCampaign: (item: CampaignItem) => void
  removeFromCampaign: (billboardId: number) => void
  clearCampaigns: () => void
  getCampaignCount: () => number
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined)

export function CampaignsProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])

  // Cargar campañas del localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCampaigns = localStorage.getItem('campaigns')
        if (savedCampaigns) {
          setCampaigns(JSON.parse(savedCampaigns))
        }
      } catch (error) {
        console.error('Error loading campaigns from localStorage:', error)
      }
    }
  }, [])

  // Guardar campañas en localStorage cuando cambien
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('campaigns', JSON.stringify(campaigns))
      } catch (error) {
        console.error('Error saving campaigns to localStorage:', error)
      }
    }
  }, [campaigns])

  const addToCampaign = useCallback((item: CampaignItem) => {
    setCampaigns(prev => {
      // Verificar si ya existe en la campaña
      const exists = prev.find(campaign => campaign.billboardId === item.billboardId)
      if (exists) {
        console.log('Soporte ya existe en la campaña')
        return prev // No agregar duplicados
      }
      console.log('Añadiendo soporte a la campaña:', item)
      return [...prev, item]
    })
  }, [])

  const removeFromCampaign = useCallback((billboardId: number) => {
    setCampaigns(prev => {
      console.log('Eliminando soporte de la campaña:', billboardId)
      return prev.filter(campaign => campaign.billboardId !== billboardId)
    })
  }, [])

  const clearCampaigns = useCallback(() => {
    console.log('Limpiando campaña')
    setCampaigns([])
  }, [])

  const getCampaignCount = useCallback(() => {
    return campaigns.length
  }, [campaigns])

  return (
    <CampaignsContext.Provider value={{
      campaigns,
      addToCampaign,
      removeFromCampaign,
      clearCampaigns,
      getCampaignCount
    }}>
      {children}
    </CampaignsContext.Provider>
  )
}

export function useCampaignsContext() {
  const context = useContext(CampaignsContext)
  if (context === undefined) {
    throw new Error('useCampaignsContext must be used within a CampaignsProvider')
  }
  return context
}
