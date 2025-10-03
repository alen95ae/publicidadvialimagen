"use client"

import { useState, useCallback } from 'react'
// import { supabase } from '@/lib/supabase' // DISABLED - Migrated to Airtable
import { useAuth } from './use-auth'
import { useToast } from './use-toast'

export function useFavorites() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading] = useState(false)

  // TODO: Implement Airtable favorites
  const loadFavorites = async () => {
    console.log('LoadFavorites disabled - Airtable migration')
  }

  // Verificar si un soporte es favorito
  const isFavorite = useCallback((soporteId: string) => {
    return favorites.has(soporteId)
  }, [favorites])

  // Añadir a favoritos
  const addFavorite = useCallback(async (soporteId: string) => {
    console.log('AddFavorite disabled - Airtable migration', soporteId)
    toast({
      variant: "destructive",
      title: "Función deshabilitada",
      description: "Los favoritos están deshabilitados temporalmente",
    })
    return false
  }, [toast])

  // Quitar de favoritos
  const removeFavorite = useCallback(async (soporteId: string) => {
    console.log('RemoveFavorite disabled - Airtable migration', soporteId)
    return false
  }, [])

  // Toggle favorito
  const toggleFavorite = useCallback(async (soporteId: string) => {
    if (isFavorite(soporteId)) {
      return await removeFavorite(soporteId)
    } else {
      return await addFavorite(soporteId)
    }
  }, [isFavorite, addFavorite, removeFavorite])

  return {
    favorites: Array.from(favorites),
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refresh: loadFavorites,
  }
}

