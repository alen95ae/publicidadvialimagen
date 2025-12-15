import { useState, useEffect, useRef } from 'react'

// Función para normalizar nombres de ciudades (mapeo ERP → Web)
function normalizeCityName(city: string): string {
  const cityMap: Record<string, string> = {
    // Santa Cruz
    'Santa Cruz': 'Santa Cruz',
    'Santa Cruz de la Sierra': 'Santa Cruz',
    // Trinidad/Beni - Beni es el departamento, Trinidad es la capital
    'Beni': 'Trinidad',
    'Trinidad': 'Trinidad',
    // Cobija/Pando - Pando es el departamento, Cobija es la capital
    'Pando': 'Cobija',
    'Cobija': 'Cobija',
    // Potosí - manejar con y sin acento
    'Potosi': 'Potosí',
    'Potosí': 'Potosí',
  }
  return cityMap[city] || city
}

// Función para extraer coordenadas de Google Maps link
function extractCoordinatesFromGoogleMaps(link: string | null): { lat: number, lng: number } | null {
  if (!link) return null
  
  try {
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    ]

    for (const pattern of patterns) {
      const match = link.match(pattern)
      if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export interface Billboard {
  id: string
  name: string
  images: string[]
  monthlyPrice: number
  location: string
  city: string
  format: string
  type: string
  dimensions: string
  visibility: string
  traffic: string
  lighting: string
  resolution?: string
  material: string
  status?: string
  available: boolean
  availableMonths: string[]
  features: string[]
  coordinates?: {
    lat: number
    lng: number
  }
  code: string
  width: number
  height: number
  impactos_diarios?: number
  description?: string
}

export function useBillboards() {
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchAttempted = useRef(false)
  const retryCount = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    // Prevenir doble fetch en desarrollo (React Strict Mode)
    if (fetchAttempted.current && retryCount.current === 0) return
    fetchAttempted.current = true

    async function fetchBillboards() {
      try {
        setLoading(true)
        setError(null)

        // Agregar timestamp para evitar caché
        const cacheBuster = `?t=${Date.now()}`
        const response = await fetch(`/api/soportes${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          // Si es error 500 y aún tenemos reintentos, reintentar
          if (response.status === 500 && retryCount.current < maxRetries) {
            retryCount.current++
            console.warn(`⚠️ Error 500, reintentando... (${retryCount.current}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current)) // Backoff exponencial
            return fetchBillboards()
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Respuesta del API soportes:', result)
        }
        
        if (result.error) {
          throw new Error(result.error)
        }

        // Transformar datos de la API al formato esperado
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Transformando datos...', result.data?.length, 'soportes')
        }
        
        const transformedData: Billboard[] = (result.data || [])
          .filter((soporte: any) => soporte && soporte.id) // Filtrar datos inválidos
          .map((soporte: any, index: number) => {
            try {
              if (process.env.NODE_ENV === 'development' && index < 3) {
                console.log(`📋 Soporte ${index}:`, {
                  id: soporte.id,
                  name: soporte.name,
                  coordinates: soporte.coordinates,
                  monthlyPrice: soporte.monthlyPrice
                })
              }
              
              return {
                id: soporte.id || `soporte-${index}`,
                code: soporte.code || soporte.id || `soporte-${index}`,
                name: soporte.name || 'Soporte sin nombre',
                images: soporte.images && Array.isArray(soporte.images) && soporte.images.length > 0
                  ? soporte.images.filter((img: any) => img)
                  : soporte.image
                  ? [soporte.image]
                  : ['/placeholder.svg?height=400&width=600'],
                monthlyPrice: soporte.monthlyPrice || 0,
                location: soporte.location || 'Ubicación no especificada',
                city: normalizeCityName(soporte.city || ''),
                format: soporte.format || 'Vallas Publicitarias',
                type: soporte.type || 'Estándar',
                dimensions: soporte.dimensions || 'Dimensiones no especificadas',
                width: soporte.monthlyPrice > 2000 ? 6 : 4,
                height: soporte.monthlyPrice > 2000 ? 3 : 2,
                visibility: soporte.visibility || 'Alto tráfico',
                traffic: soporte.traffic || 'Variable',
                lighting: soporte.lighting || 'No especificado',
                resolution: soporte.format === 'Pantallas LED' ? '1920x1080 Full HD' : undefined,
                material: soporte.format === 'Pantallas LED' ? 'Pantalla LED exterior' : 'Material exterior',
                status: soporte.status || 'Disponible',
                available: soporte.available !== undefined ? soporte.available : true,
                availableMonths: Array.isArray(soporte.availableMonths) ? soporte.availableMonths : [],
                features: Array.isArray(soporte.features) ? soporte.features : [],
                coordinates: soporte.coordinates && soporte.coordinates.lat && soporte.coordinates.lng 
                  ? { lat: soporte.coordinates.lat, lng: soporte.coordinates.lng } 
                  : undefined,
                impactos_diarios: soporte.traffic ? parseInt(String(soporte.traffic).replace(/[^\d]/g, '')) || undefined : undefined,
                description: soporte.description || '',
              }
            } catch (err) {
              console.error(`Error transformando soporte ${soporte?.id}:`, err)
              return null
            }
          })
          .filter((item: any) => item !== null) // Filtrar items que fallaron en la transformación

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Datos transformados:', transformedData.length, 'soportes')
        }
        
        // Solo actualizar si tenemos datos válidos
        if (transformedData.length > 0) {
          setBillboards(transformedData)
          retryCount.current = 0 // Resetear contador de reintentos en éxito
        } else {
          throw new Error('No se obtuvieron soportes válidos')
        }
      } catch (err: any) {
        // Ignorar errores de abort
        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          return
        }
        
        // Solo loggear errores en desarrollo, no en producción
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching billboards:', err)
        }
        
        // Si aún tenemos reintentos y no es un error de abort, reintentar
        if (retryCount.current < maxRetries && err.name !== 'AbortError') {
          retryCount.current++
          console.warn(`⚠️ Error al obtener soportes, reintentando... (${retryCount.current}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current))
          return fetchBillboards()
        }
        
        // Si ya agotamos los reintentos, establecer error
        setError(err.message || 'Error al cargar los soportes')
        
        // Fallback a datos mock solo si no hay datos previos
        if (billboards.length === 0) {
          const mockData: Billboard[] = [
            {
              id: 'mock-1',
              code: 'LP-001',
              name: 'Valla publicitaria centro comercial',
              images: ['/placeholder.svg?height=400&width=600'],
              monthlyPrice: 2500,
              location: 'La Paz',
              city: 'La Paz',
              format: 'Vallas Publicitarias',
              type: 'Estándar',
              dimensions: '6x3 metros',
              width: 6,
              height: 3,
              visibility: 'Alto tráfico',
              traffic: '15000 personas/día',
              lighting: '24/7',
              material: 'Vinilo exterior',
              available: true,
              availableMonths: ['2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07'],
              features: ['Ubicación estratégica', 'Alta visibilidad', 'Material resistente', 'Instalación profesional'],
              impactos_diarios: 15000
            }
          ]
          setBillboards(mockData)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBillboards()
  }, [])

  return { billboards, loading, error, refetch: () => typeof window !== 'undefined' ? window.location.reload() : undefined }
}
