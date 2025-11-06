import { useState, useEffect } from 'react'

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

  useEffect(() => {
    async function fetchBillboards() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/soportes')
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        
        console.log('🔍 Respuesta del API soportes:', result)
        
        if (result.error) {
          throw new Error(result.error)
        }

        // Transformar datos de la API al formato esperado
        console.log('🔄 Transformando datos...', result.data?.length, 'soportes')
        const transformedData: Billboard[] = (result.data || []).map((soporte: any, index: number) => {
          if (index < 3) {
            console.log(`📋 Soporte ${index}:`, {
              id: soporte.id,
              name: soporte.name,
              coordinates: soporte.coordinates,
              monthlyPrice: soporte.monthlyPrice
            })
          }
          return {
          id: soporte.id,
          code: soporte.code || soporte.id, // Usar código real del soporte (ej: "34-LPZ")
          name: soporte.name,
          images: soporte.images || [soporte.image], // Usar todas las imágenes disponibles
          monthlyPrice: soporte.monthlyPrice,
          location: soporte.location,
          city: normalizeCityName(soporte.city), // Normalizar ciudad (Pando → Cobija)
          format: soporte.format,
          type: soporte.type,
          dimensions: soporte.dimensions,
          width: soporte.monthlyPrice > 2000 ? 6 : 4, // Estimar basado en precio
          height: soporte.monthlyPrice > 2000 ? 3 : 2,
          visibility: soporte.visibility,
          traffic: soporte.traffic,
          lighting: soporte.lighting,
          resolution: soporte.format === 'Pantallas LED' ? '1920x1080 Full HD' : undefined,
          material: soporte.format === 'Pantallas LED' ? 'Pantalla LED exterior' : 'Material exterior',
          status: soporte.status || 'Disponible',
          available: soporte.available,
          availableMonths: soporte.availableMonths,
          features: soporte.features,
          coordinates: soporte.coordinates && soporte.coordinates.lat && soporte.coordinates.lng 
            ? { lat: soporte.coordinates.lat, lng: soporte.coordinates.lng } 
            : undefined,
          impactos_diarios: soporte.traffic ? parseInt(soporte.traffic.replace(/[^\d]/g, '')) : undefined,
          description: soporte.description || '',
        }
        })

        console.log('✅ Datos transformados:', transformedData.length, 'soportes')
        setBillboards(transformedData)
      } catch (err: any) {
        console.error('Error fetching billboards:', err)
        setError(err.message || 'Error al cargar las vallas publicitarias')
        
        // Fallback a datos mock en caso de error
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
      } finally {
        setLoading(false)
      }
    }

    fetchBillboards()
  }, [])

  return { billboards, loading, error, refetch: () => typeof window !== 'undefined' ? window.location.reload() : undefined }
}
