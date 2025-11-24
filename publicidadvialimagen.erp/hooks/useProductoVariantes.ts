/**
 * Hook para gestionar variantes de productos
 * Proporciona funciones para cargar, guardar, resetear y recalcular variantes
 */

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface ProductoVariante {
  id: string
  producto_id: string
  combinacion: string
  coste_override: number | null
  precio_override: number | null
  margen_override: number | null
  precio_variante: any | null
  coste_calculado: number
  precio_calculado: number
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface VarianteOverride {
  coste_override?: number | null
  precio_override?: number | null
  margen_override?: number | null
}

/**
 * Hook para gestionar variantes de productos
 */
export function useProductoVariantes(productoId: string | null) {
  const [variantes, setVariantes] = useState<ProductoVariante[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  /**
   * Carga todas las variantes de un producto
   */
  const getVariantes = useCallback(async () => {
    if (!productoId) {
      setVariantes([])
      return []
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/productos/variantes?producto_id=${productoId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar variantes')
      }

      const data = await response.json()
      // El API devuelve { success: true, variantes: [...] }
      const variantesData = Array.isArray(data.variantes) 
        ? data.variantes 
        : Array.isArray(data.data) 
        ? data.data 
        : []
      
      // Asegurar que todas las variantes tengan los campos necesarios
      const variantesValidas = variantesData
        .filter((v: any) => v && v.id && v.combinacion)
        .map((v: any) => ({
          ...v,
          coste_override: v.coste_override ?? null,
          precio_override: v.precio_override ?? null,
          margen_override: v.margen_override ?? null,
          precio_variante: v.precio_variante ?? null,
          coste_calculado: v.coste_calculado ?? v.coste_base ?? 0,
          precio_calculado: v.precio_calculado ?? v.precio_base ?? 0
        }))
      
      setVariantes(variantesValidas)
      return variantesValidas
    } catch (error: any) {
      console.error('Error cargando variantes:', error)
      toast.error(error?.message || 'Error al cargar variantes del producto')
      setVariantes([])
      return []
    } finally {
      setLoading(false)
    }
  }, [productoId])

  /**
   * Guarda overrides de una variante específica
   */
  const saveVariante = useCallback(async (
    varianteId: string,
    overrides: VarianteOverride
  ) => {
    if (!productoId) {
      toast.error('No hay producto seleccionado')
      return false
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/productos/variantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variante_id: varianteId,
          producto_id: productoId,
          ...overrides
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar variante')
      }

      const data = await response.json()
      
      // Actualizar estado local
      setVariantes(prev => prev.map(v => 
        v.id === varianteId 
          ? { ...v, ...overrides }
          : v
      ))

      toast.success('Variante actualizada correctamente')
      return true
    } catch (error: any) {
      console.error('Error guardando variante:', error)
      toast.error(error.message || 'Error al guardar variante')
      return false
    } finally {
      setSaving(false)
    }
  }, [productoId])

  /**
   * Resetea los overrides de una variante (vuelve a usar valores base)
   */
  const resetVariante = useCallback(async (varianteId: string) => {
    if (!productoId) {
      toast.error('No hay producto seleccionado')
      return false
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/productos/variantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variante_id: varianteId,
          producto_id: productoId,
          coste_override: null,
          precio_override: null,
          margen_override: null,
          precio_variante: null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al resetear variante')
      }

      const data = await response.json()
      
      // Actualizar estado local
      setVariantes(prev => prev.map(v => 
        v.id === varianteId 
          ? { 
              ...v, 
              coste_override: null,
              precio_override: null,
              margen_override: null,
              precio_variante: null
            }
          : v
      ))

      toast.success('Overrides reseteados correctamente')
      return true
    } catch (error: any) {
      console.error('Error reseteando variante:', error)
      toast.error(error.message || 'Error al resetear variante')
      return false
    } finally {
      setSaving(false)
    }
  }, [productoId])

  /**
   * Recalcula todas las variantes del producto desde el coste base
   */
  const recalcularTodas = useCallback(async () => {
    if (!productoId) {
      toast.error('No hay producto seleccionado')
      return false
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/productos/variantes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          producto_id: productoId,
          action: 'recalcular'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al recalcular variantes')
      }

      const data = await response.json()
      const variantesRecalculadas = data.variantes || []
      
      setVariantes(variantesRecalculadas)
      toast.success(`${variantesRecalculadas.length} variante(s) recalculada(s)`)
      return true
    } catch (error: any) {
      console.error('Error recalculando variantes:', error)
      toast.error(error.message || 'Error al recalcular variantes')
      return false
    } finally {
      setSaving(false)
    }
  }, [productoId])

  /**
   * Regenera las variantes cuando cambian las definiciones del producto
   */
  const regenerarVariantes = useCallback(async (variantesDefinicion: any[]) => {
    if (!productoId) {
      toast.error('No hay producto seleccionado')
      return false
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/productos/variantes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          producto_id: productoId,
          action: 'regenerar',
          variantes_definicion: variantesDefinicion
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al regenerar variantes')
      }

      const data = await response.json()
      const variantesRegeneradas = Array.isArray(data.variantes) ? data.variantes : []
      
      // Actualizar estado con las variantes regeneradas
      if (variantesRegeneradas.length > 0) {
        const variantesValidas = variantesRegeneradas
          .filter((v: any) => v && v.id && v.combinacion)
          .map((v: any) => ({
            ...v,
            coste_override: v.coste_override ?? null,
            precio_override: v.precio_override ?? null,
            margen_override: v.margen_override ?? null,
            precio_variante: v.precio_variante ?? null,
            coste_calculado: v.coste_calculado ?? v.coste_base ?? 0,
            precio_calculado: v.precio_calculado ?? v.precio_base ?? 0
          }))
        
        setVariantes(variantesValidas)
        toast.success(`${variantesValidas.length} variante(s) generada(s)`)
      } else if (data.errores && data.errores.length > 0) {
        // Si hay errores pero también hay variantes creadas
        if (data.variantes_creadas > 0) {
          toast.warning(`${data.variantes_creadas} variante(s) creada(s) pero hubo ${data.errores.length} error(es)`)
        } else {
          toast.error(`No se pudieron crear las variantes: ${data.error || 'Error desconocido'}`)
        }
      } else {
        toast.warning('No se generaron variantes')
      }
      
      return true
    } catch (error: any) {
      console.error('Error regenerando variantes:', error)
      toast.error(error.message || 'Error al regenerar variantes')
      return false
    } finally {
      setSaving(false)
    }
  }, [productoId])

  // Cargar variantes automáticamente cuando cambia el productoId
  useEffect(() => {
    if (productoId) {
      getVariantes()
    } else {
      setVariantes([])
    }
  }, [productoId, getVariantes])

  return {
    variantes,
    loading,
    saving,
    getVariantes,
    saveVariante,
    resetVariante,
    recalcularTodas,
    regenerarVariantes
  }
}

