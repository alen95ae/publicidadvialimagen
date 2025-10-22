"use client"

import { useState, useEffect } from 'react'
import { useToast } from './use-toast'

export interface Quote {
  id: string
  created_at: string
  empresa: string
  email: string
  telefono: string
  mensaje: string
  estado: 'Nueva' | 'En Proceso' | 'Respondida' | 'Cerrada' | 'pendiente' | 'respondida' | 'cerrada'
  respuesta?: string
  fecha_respuesta?: string
  soporte?: string
  fecha_inicio?: string
  meses_alquiler?: number
  servicios_adicionales?: string[]
}

export function useCotizaciones(userEmail?: string) {
  const { toast } = useToast()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar cotizaciones al inicializar
  useEffect(() => {
    if (userEmail) {
      loadQuotes()
    }
  }, [userEmail])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando cotizaciones para:', userEmail)
      
      const response = await fetch('/api/cotizaciones')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📊 Total cotizaciones recibidas:', data.length)
      
      if (!Array.isArray(data)) {
        console.error('❌ Los datos no son un array:', data)
        setQuotes([])
        return
      }

      // Filtrar solo las cotizaciones del usuario por email
      const userQuotes = data.filter((quote: Quote) => 
        quote.email?.toLowerCase() === userEmail?.toLowerCase()
      )
      
      // Ordenar por fecha de creación (más recientes primero)
      userQuotes.sort((a, b) => {
        const fechaA = new Date(a.created_at).getTime()
        const fechaB = new Date(b.created_at).getTime()
        return fechaB - fechaA // Más recientes primero
      })
      
      console.log('✅ Cotizaciones filtradas para', userEmail, ':', userQuotes.length)
      if (userQuotes.length > 0) {
        console.log('📋 Primera cotización:', userQuotes[0])
      }
      setQuotes(userQuotes)
      
    } catch (error: any) {
      console.error('❌ Error cargando cotizaciones:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
      })
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  return {
    quotes,
    loading,
    refresh: loadQuotes,
  }
}
