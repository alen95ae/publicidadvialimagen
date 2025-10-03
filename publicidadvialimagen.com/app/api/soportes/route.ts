import { NextResponse } from 'next/server'
import Airtable from 'airtable'

// Configurar Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const city = searchParams.get('city')
    const format = searchParams.get('format')
    const type = searchParams.get('type')
    const availability = searchParams.get('availability')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // Obtener datos de Airtable
    const records = await base("Soportes").select({
      filterByFormula: `{Estado} = 'DISPONIBLE'` // Solo mostrar disponibles en la web
    }).all()

    const soportes = records.map(r => {
      const soporte = {
        id: r.id,
        codigo: r.fields['Código'],
        titulo: r.fields['Título'],
        tipo_soporte: r.fields['Tipo de soporte'],
        estado: r.fields['Estado'],
        ancho: r.fields['Ancho'],
        alto: r.fields['Alto'],
        ciudad: r.fields['Ciudad'],
        precio_mes: r.fields['Precio por mes'],
        impactos_diarios: r.fields['Impactos diarios'],
        ubicacion_url: r.fields['Enlace Google Maps'],
        foto_url: r.fields['Imagen principal']?.[0]?.url,
        foto_url_2: r.fields['Imagen secundaria 1']?.[0]?.url,
        foto_url_3: r.fields['Imagen secundaria 2']?.[0]?.url,
        notas: r.fields['Dirección / Notas'],
        propietario: r.fields['Propietario']
      }
      
      // Log de imágenes para depuración
      if (soporte.foto_url || soporte.foto_url_2 || soporte.foto_url_3) {
        console.log(`📸 Imágenes en soporte ${soporte.codigo}:`, {
          principal: soporte.foto_url ? '✅' : '❌',
          secundaria1: soporte.foto_url_2 ? '✅' : '❌',
          secundaria2: soporte.foto_url_3 ? '✅' : '❌'
        })
      }
      
      return soporte
    })

    // Aplicar filtros
    let filteredSoportes = soportes

    if (city) {
      filteredSoportes = filteredSoportes.filter(s => 
        s.ciudad?.toLowerCase().includes(city.toLowerCase())
      )
    }

    if (minPrice) {
      filteredSoportes = filteredSoportes.filter(s => 
        (s.precio_mes || 0) >= parseFloat(minPrice)
      )
    }

    if (maxPrice) {
      filteredSoportes = filteredSoportes.filter(s => 
        (s.precio_mes || 0) <= parseFloat(maxPrice)
      )
    }

    // Transformar datos para el frontend
    const transformedSoportes = filteredSoportes?.map(soporte => {
      // Recopilar todas las imágenes disponibles
      const images = [
        soporte.foto_url,
        soporte.foto_url_2,
        soporte.foto_url_3
      ].filter(Boolean)
      
      console.log(`🖼️ Soporte ${soporte.codigo} - ${images.length} imágenes:`, images.length > 0 ? images : 'Sin imágenes')
      
      return {
        id: soporte.id,
        name: soporte.titulo || soporte.codigo,
        image: images[0] || "/placeholder.svg?height=300&width=400",
        images: images.length > 0 ? images : ["/placeholder.svg?height=300&width=400"],
        monthlyPrice: soporte.precio_mes || 0,
        location: soporte.notas || `${soporte.ciudad}, Bolivia`,
        city: soporte.ciudad || 'Bolivia',
        format: getFormatFromType(soporte.tipo_soporte),
        type: getTypeFromType(soporte.tipo_soporte),
        dimensions: `${soporte.ancho || 0}m x ${soporte.alto || 0}m`,
        visibility: getVisibilityFromType(soporte.tipo_soporte),
        traffic: soporte.impactos_diarios ? `${soporte.impactos_diarios.toLocaleString()} personas/día` : 'Variable',
        lighting: getLightingFromType(soporte.tipo_soporte),
        available: soporte.estado === 'DISPONIBLE',
        availableMonths: generateAvailableMonths(),
        features: getFeaturesFromType(soporte.tipo_soporte),
        coordinates: getCoordinatesFromCity(soporte.ciudad),
      }
    }) || []

    return NextResponse.json({
      data: transformedSoportes,
      pagination: {
        page,
        limit,
        total: transformedSoportes.length,
        hasNext: transformedSoportes.length === limit,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error in soportes API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Funciones auxiliares para transformar datos (adaptadas para Airtable)
function getFormatFromType(tipo?: string): string {
  if (!tipo) return 'Impresa'
  const tipoLower = tipo.toLowerCase()
  
  const formatMap: Record<string, string> = {
    'pantallas led': 'Digital LED',
    'pantalla led': 'Digital LED',
    'vallas publicitarias': 'Impresa',
    'valla': 'Impresa',
    'murales': 'Backlight',
    'publicidad móvil': 'Impresa',
    'marquesina': 'Backlight',
    'monoposte': 'Impresa'
  }
  return formatMap[tipoLower] || 'Impresa'
}

function getTypeFromType(tipo?: string): string {
  if (!tipo) return 'Premium'
  const tipoLower = tipo.toLowerCase()
  
  const typeMap: Record<string, string> = {
    'pantallas led': 'Premium',
    'pantalla led': 'Premium',
    'vallas publicitarias': 'Autopista',
    'valla': 'Autopista',
    'murales': 'Mobiliario Urbano',
    'publicidad móvil': 'Móvil',
    'marquesina': 'Mobiliario Urbano',
    'monoposte': 'Autopista'
  }
  return typeMap[tipoLower] || 'Premium'
}

function getVisibilityFromType(tipo?: string): string {
  if (!tipo) return 'Alto tráfico'
  const tipoLower = tipo.toLowerCase()
  
  const visibilityMap: Record<string, string> = {
    'pantallas led': 'Muy alto tráfico',
    'pantalla led': 'Muy alto tráfico',
    'vallas publicitarias': 'Alto tráfico',
    'murales': 'Medio-alto tráfico',
    'publicidad móvil': 'Variable'
  }
  return visibilityMap[tipoLower] || 'Alto tráfico'
}

function getLightingFromType(tipo?: string): string {
  if (!tipo) return 'Iluminada'
  const tipoLower = tipo.toLowerCase()
  
  const lightingMap: Record<string, string> = {
    'pantallas led': '24/7',
    'pantalla led': '24/7',
    'vallas publicitarias': 'Iluminada',
    'murales': 'Retroiluminada',
    'publicidad móvil': 'Variable'
  }
  return lightingMap[tipoLower] || 'Iluminada'
}

function getFeaturesFromType(tipo?: string): string[] {
  if (!tipo) return ['Ubicación premium', 'Alta visibilidad']
  const tipoLower = tipo.toLowerCase()
  
  const featuresMap: Record<string, string[]> = {
    'pantallas led': ['Resolución 4K', 'Contenido dinámico', 'Ubicación premium'],
    'pantalla led': ['Resolución 4K', 'Contenido dinámico', 'Ubicación premium'],
    'vallas publicitarias': ['Doble cara', 'Iluminación LED', 'Fácil acceso'],
    'murales': ['Retroiluminación', 'Protección clima', 'Zona comercial'],
    'publicidad móvil': ['Flexibilidad total', 'Eventos personalizados', 'Ubicación variable']
  }
  return featuresMap[tipoLower] || ['Ubicación premium', 'Alta visibilidad']
}

function getCoordinatesFromCity(ciudad: string): [number, number] {
  const cityCoordinates: Record<string, [number, number]> = {
    'La Paz': [-16.5000, -68.1500],
    'Santa Cruz': [-17.7833, -63.1833],
    'Cochabamba': [-17.3833, -66.1667],
    'El Alto': [-16.5167, -68.1833],
    'Sucre': [-19.0500, -65.2500],
    'Potosí': [-19.5833, -65.7500],
    'Tarija': [-21.5333, -64.7333],
    'Oruro': [-17.9833, -67.1500],
    'Trinidad': [-14.8333, -64.9000]
  }
  return cityCoordinates[ciudad] || [-16.5000, -68.1500] // La Paz por defecto
}

function generateAvailableMonths(): string[] {
  const months = []
  const currentDate = new Date()
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    months.push(date.toISOString().slice(0, 7)) // YYYY-MM format
  }
  return months
}
