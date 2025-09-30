import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

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

    let query = supabaseServer
      .from('soportes')
      .select('*')
      .neq('Disponibilidad', 'ocupado') // Mostrar todos excepto los ocupados

    // Aplicar filtros
    if (city) {
      query = query.ilike('Ciudad', `%${city}%`)
    }
    
    if (format) {
      // Mapear formatos del frontend a tipos de la DB
      const formatMap: Record<string, string> = {
        'Digital LED': 'pantalla_led',
        'Impresa': 'valla',
        'Backlight': 'marquesina'
      }
      if (formatMap[format]) {
        query = query.eq('Tipo', formatMap[format])
      }
    }
    
    if (type) {
      // Mapear tipos del frontend a tipos de la DB
      const typeMap: Record<string, string> = {
        'Premium': 'pantalla_led',
        'Autopista': 'valla',
        'Mobiliario Urbano': 'marquesina',
        'Móvil': 'otro'
      }
      if (typeMap[type]) {
        query = query.eq('Tipo', typeMap[type])
      }
    }
    
    if (minPrice) {
      query = query.gte('Precio por mes', parseFloat(minPrice))
    }
    
    if (maxPrice) {
      query = query.lte('Precio por mes', parseFloat(maxPrice))
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to)

    const { data: soportes, error } = await query

    if (error) {
      console.error('Error fetching soportes:', error)
      return NextResponse.json({ error: 'Error al cargar los soportes' }, { status: 500 })
    }

    // Transformar datos para el frontend
    const transformedSoportes = soportes?.map(soporte => ({
      id: soporte.id,
      name: soporte.titulo || soporte.nombre,
      image: soporte.foto_url || "/placeholder.svg?height=300&width=400",
      monthlyPrice: soporte['Precio por mes'] || 0,
      location: soporte.ubicacion || `${soporte.Ciudad}, Bolivia`,
      city: soporte.Ciudad || 'Bolivia',
      format: getFormatFromType(soporte.Tipo),
      type: getTypeFromType(soporte.Tipo),
      dimensions: `${soporte.Ancho || 0}m x ${soporte.Alto || 0}m`,
      visibility: getVisibilityFromType(soporte.Tipo),
      traffic: soporte['Impactos diarios'] ? `${soporte['Impactos diarios'].toLocaleString()} personas/día` : 'Variable',
      lighting: getLightingFromType(soporte.Tipo),
      available: soporte.Disponibilidad === 'disponible',
      availableMonths: generateAvailableMonths(),
      features: getFeaturesFromType(soporte.Tipo),
      coordinates: getCoordinatesFromCity(soporte.Ciudad),
    })) || []

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

// Funciones auxiliares para transformar datos
function getFormatFromType(tipo: string): string {
  const formatMap: Record<string, string> = {
    'pantalla_led': 'Digital LED',
    'valla': 'Impresa',
    'marquesina': 'Backlight',
    'monoposte': 'Impresa',
    'mupi': 'Backlight',
    'banderola': 'Impresa',
    'otro': 'Impresa'
  }
  return formatMap[tipo] || 'Impresa'
}

function getTypeFromType(tipo: string): string {
  const typeMap: Record<string, string> = {
    'pantalla_led': 'Premium',
    'valla': 'Autopista',
    'marquesina': 'Mobiliario Urbano',
    'monoposte': 'Autopista',
    'mupi': 'Mobiliario Urbano',
    'banderola': 'Autopista',
    'otro': 'Móvil'
  }
  return typeMap[tipo] || 'Premium'
}

function getVisibilityFromType(tipo: string): string {
  const visibilityMap: Record<string, string> = {
    'pantalla_led': 'Muy alto tráfico',
    'valla': 'Alto tráfico',
    'marquesina': 'Medio-alto tráfico',
    'monoposte': 'Alto tráfico',
    'mupi': 'Medio tráfico',
    'banderola': 'Alto tráfico',
    'otro': 'Variable'
  }
  return visibilityMap[tipo] || 'Alto tráfico'
}

function getLightingFromType(tipo: string): string {
  const lightingMap: Record<string, string> = {
    'pantalla_led': '24/7',
    'valla': 'Iluminada',
    'marquesina': 'Retroiluminada',
    'monoposte': 'Iluminada',
    'mupi': 'Retroiluminada',
    'banderola': 'Iluminada',
    'otro': 'Variable'
  }
  return lightingMap[tipo] || 'Iluminada'
}

function getFeaturesFromType(tipo: string): string[] {
  const featuresMap: Record<string, string[]> = {
    'pantalla_led': ['Resolución 4K', 'Contenido dinámico', 'Ubicación premium'],
    'valla': ['Doble cara', 'Iluminación LED', 'Fácil acceso'],
    'marquesina': ['Retroiluminación', 'Protección clima', 'Zona comercial'],
    'monoposte': ['Doble cara', 'Iluminación LED', 'Fácil acceso'],
    'mupi': ['Retroiluminación', 'Protección clima', 'Zona comercial'],
    'banderola': ['Doble cara', 'Iluminación LED', 'Fácil acceso'],
    'otro': ['Flexibilidad total', 'Eventos personalizados', 'Ubicación variable']
  }
  return featuresMap[tipo] || ['Ubicación premium', 'Alta visibilidad']
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
