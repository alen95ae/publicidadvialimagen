import { useState, useEffect } from 'react'

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
        
        if (result.error) {
          throw new Error(result.error)
        }

        // Transformar datos de la API al formato esperado
        const transformedData: Billboard[] = (result.data || []).map((soporte: any) => ({
          id: soporte.id,
          code: soporte.id, // Usar ID como código temporal
          name: soporte.name,
          images: [soporte.image],
          monthlyPrice: soporte.monthlyPrice,
          location: soporte.location,
          city: soporte.city,
          format: soporte.format,
          type: soporte.type,
          dimensions: soporte.dimensions,
          width: soporte.monthlyPrice > 2000 ? 6 : 4, // Estimar basado en precio
          height: soporte.monthlyPrice > 2000 ? 3 : 2,
          visibility: soporte.visibility,
          traffic: soporte.traffic,
          lighting: soporte.lighting,
          resolution: soporte.format === 'Digital LED' ? '1920x1080 Full HD' : undefined,
          material: soporte.format === 'Digital LED' ? 'Pantalla LED exterior' : 'Material exterior',
          available: soporte.available,
          availableMonths: soporte.availableMonths,
          features: soporte.features,
          coordinates: soporte.coordinates ? { lat: soporte.coordinates[0], lng: soporte.coordinates[1] } : undefined,
          impactos_diarios: soporte.traffic ? parseInt(soporte.traffic.replace(/[^\d]/g, '')) : undefined,
        }))

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
            format: 'Valla Publicitaria',
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

  return { billboards, loading, error, refetch: () => window.location.reload() }
}
