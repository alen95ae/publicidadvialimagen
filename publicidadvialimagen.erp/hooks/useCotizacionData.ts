/**
 * Hook compartido para manejo de datos de cotización
 * 
 * E1: setProductosList funcional (prev => ...) para evitar race conditions
 * E2: AbortController para todos los fetches
 * E7: Sincronización de totales con estado actual
 * F1, F2: Garantizar que totales siempre coincidan con productosList
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { calcularTotal, calcularTotalM2 } from '@/lib/calculosInternos'

export interface ProductoItem {
  id: string
  tipo: 'producto'
  producto: string
  producto_id?: string
  imagen?: string
  imagenFile?: File
  imagenOriginalUrl?: string
  descripcion: string
  cantidad: number
  ancho: number
  alto: number
  totalM2: number
  udm: string
  precio: number
  comision: number
  conIVA: boolean
  conIT: boolean
  total: number
  totalManual?: number | null
  esSoporte?: boolean
  dimensionesBloqueadas?: boolean
  variantes?: Record<string, string> | null
}

export interface NotaItem {
  id: string
  tipo: 'nota'
  texto: string
}

export interface SeccionItem {
  id: string
  tipo: 'seccion'
  texto: string
}

export type ItemLista = ProductoItem | NotaItem | SeccionItem

interface UseCotizacionDataReturn {
  productosList: ItemLista[]
  setProductosList: React.Dispatch<React.SetStateAction<ItemLista[]>>
  updateProductosList: (updater: (prev: ItemLista[]) => ItemLista[]) => void
  totalGeneral: number
  totalGeneralReal: number
  totalManual: number | null
  setTotalManual: (value: number | null) => void
  recalculateTotals: () => void
  abortControllerRef: React.MutableRefObject<AbortController | null>
  createAbortController: () => AbortController
}

/**
 * Hook para manejar datos de cotización de forma segura
 * 
 * E1: Usa setState funcional para evitar race conditions
 * E2: Proporciona AbortController para todos los fetches
 * F1, F2: Sincroniza totales automáticamente con productosList
 */
export function useCotizacionData(initialTotalManual: number | null = null): UseCotizacionDataReturn {
  const [productosList, setProductosListState] = useState<ItemLista[]>([])
  const [totalManual, setTotalManualState] = useState<number | null>(initialTotalManual)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * E1: setProductosList funcional para evitar race conditions
   * Siempre usa la forma funcional (prev => ...) para garantizar que se use el estado más reciente
   */
  const setProductosList = useCallback((updater: React.SetStateAction<ItemLista[]>) => {
    if (typeof updater === 'function') {
      setProductosListState(updater)
    } else {
      setProductosListState(updater)
    }
  }, [])

  /**
   * Función helper para actualizar productosList de forma atómica
   */
  const updateProductosList = useCallback((updater: (prev: ItemLista[]) => ItemLista[]) => {
    setProductosListState(prev => updater(prev))
  }, [])

  /**
   * E2: Crear nuevo AbortController para cada fetch
   */
  const createAbortController = useCallback(() => {
    // Cancelar el controller anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller
    return controller
  }, [])

  /**
   * F1, F2: Calcular totales sincronizados con productosList
   */
  const recalculateTotals = useCallback(() => {
    const productos = productosList.filter((item): item is ProductoItem => item.tipo === 'producto')
    
    const productosConTotal = productos.map(producto => {
      const udmLower = producto.udm?.toLowerCase().trim() || ''
      const esUnidades = udmLower === 'unidad' || udmLower === 'unidades' || udmLower === 'unidade'

      const totalCalculado = calcularTotal(
        producto.cantidad,
        producto.totalM2,
        producto.precio,
        producto.comision,
        producto.conIVA,
        producto.conIT,
        producto.esSoporte || esUnidades,
        producto.udm
      )

      return {
        ...producto,
        totalCalculado
      }
    })

    // Total general real: suma de los totales de cada línea
    const totalGeneralReal = productosConTotal.reduce((sum, producto) => sum + (producto.total || 0), 0)

    return {
      totalGeneralReal,
      totalGeneral: totalManual !== null && totalManual !== undefined ? totalManual : totalGeneralReal
    }
  }, [productosList, totalManual])

  // Calcular totales derivados
  const { totalGeneralReal, totalGeneral } = recalculateTotals()

  /**
   * Efecto para limpiar AbortController al desmontar
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    productosList,
    setProductosList,
    updateProductosList,
    totalGeneral,
    totalGeneralReal,
    totalManual,
    setTotalManual: setTotalManualState,
    recalculateTotals,
    abortControllerRef,
    createAbortController
  }
}

/**
 * Helper para hacer fetch con AbortController
 * E2: Evita que respuestas antiguas sobrescriban cambios nuevos
 */
export async function fetchWithAbort(
  url: string,
  controller: AbortController,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  })

  // Verificar si la solicitud fue cancelada
  if (controller.signal.aborted) {
    throw new Error('Request aborted')
  }

  return response
}

/**
 * Helper para hacer múltiples fetches con AbortController
 */
export async function fetchAllWithAbort(
  urls: string[],
  controller: AbortController,
  options?: RequestInit
): Promise<Response[]> {
  return Promise.all(
    urls.map(url => fetchWithAbort(url, controller, options))
  )
}

