"use client"

import { useState, useEffect, useCallback } from "react"

export interface CampaignItem {
  id: string
  billboardId: number
  name: string
  city: string
  dimensions: string
  impacts: string
  type: string
  startDate: string
  months: number
  image: string
}

// Función para obtener campañas del localStorage
const getCampaignsFromStorage = (): CampaignItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const savedCampaigns = localStorage.getItem('campaigns')
    return savedCampaigns ? JSON.parse(savedCampaigns) : []
  } catch (error) {
    console.error('Error loading campaigns from localStorage:', error)
    return []
  }
}

// Función para guardar campañas en localStorage
const saveCampaignsToStorage = (campaigns: CampaignItem[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('campaigns', JSON.stringify(campaigns))
  } catch (error) {
    console.error('Error saving campaigns to localStorage:', error)
  }
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])

  // Cargar campañas del localStorage al inicializar
  useEffect(() => {
    setCampaigns(getCampaignsFromStorage())
  }, [])

  // Guardar campañas en localStorage cuando cambien
  useEffect(() => {
    saveCampaignsToStorage(campaigns)
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

  return {
    campaigns,
    addToCampaign,
    removeFromCampaign,
    clearCampaigns,
    getCampaignCount
  }
}
