import { useState, useEffect, useCallback } from 'react'

export interface CategoriaConfig {
  id?: string
  nombre: string
  modulo: string
  seccion: string
  categorias: string[]
  fecha_creacion?: string
  fecha_actualizacion?: string
}

export function useCategorias(modulo: string, seccion: string) {
  const [config, setConfig] = useState<CategoriaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/categorias?modulo=${encodeURIComponent(modulo)}&seccion=${encodeURIComponent(seccion)}`
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setConfig(result.data)
      } else {
        setConfig(null)
      }
    } catch (err) {
      console.error('❌ Error cargando categorías:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [modulo, seccion])

  const updateCategorias = useCallback(
    async (categorias: string[]): Promise<boolean> => {
      try {
        setError(null)

        const response = await fetch('/api/categorias', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modulo,
            seccion,
            categorias
          })
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || `Error ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
          setConfig(result.data)
          return true
        }

        return false
      } catch (err) {
        console.error('❌ Error actualizando categorías:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        return false
      }
    },
    [modulo, seccion]
  )

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    categorias: config?.categorias || [],
    loading,
    error,
    refetch: fetchConfig,
    updateCategorias
  }
}
