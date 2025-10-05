import { NextResponse } from 'next/server'
import Airtable from 'airtable'

// Configurar Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!)

/** Normalizar nombres de ciudades para mantener consistencia en la web */
function normalizeCityName(ciudad: string | undefined): string {
  if (!ciudad) return 'Bolivia'
  
  const cityMap: Record<string, string> = {
    // Santa Cruz
    'Santa Cruz': 'Santa Cruz de la Sierra',
    'Santa Cruz de la Sierra': 'Santa Cruz de la Sierra',
    // Trinidad/Beni - Beni es el departamento, Trinidad es la capital
    'Beni': 'Trinidad',
    'Trinidad': 'Trinidad',
    // Potosí - manejar con y sin acento
    'Potosi': 'Potosí',
    'Potosí': 'Potosí',
  }
  
  return cityMap[ciudad] || ciudad
}

/** Extraer coordenadas de un enlace de Google Maps */
function extractCoordinatesFromGoogleMapsLink(link?: string): { latitude: number | null, longitude: number | null } {
  if (!link) return { latitude: null, longitude: null }
  
  try {
    // Patrón 1: /search/-16.498835,+-68.164877
    const searchPattern = /\/search\/(-?\d+\.?\d*),\+?(-?\d+\.?\d*)/
    const searchMatch = link.match(searchPattern)
    if (searchMatch) {
      return {
        latitude: parseFloat(searchMatch[1]),
        longitude: parseFloat(searchMatch[2])
      }
    }
    
    // Patrón 2: @-16.123,-68.456
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const atMatch = link.match(atPattern)
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2])
      }
    }
    
    // Patrón 3: ?q=-16.123,-68.456
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const qMatch = link.match(qPattern)
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2])
      }
    }
    
    // Patrón 4: ll=-16.123,-68.456
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const llMatch = link.match(llPattern)
    if (llMatch) {
      return {
        latitude: parseFloat(llMatch[1]),
        longitude: parseFloat(llMatch[2])
      }
    }
    
    // Patrón 5: !3d-16.123!4d-68.456
    const dPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/
    const dMatch = link.match(dPattern)
    if (dMatch) {
      return {
        latitude: parseFloat(dMatch[1]),
        longitude: parseFloat(dMatch[2])
      }
    }
    
    return { latitude: null, longitude: null }
  } catch (error) {
    return { latitude: null, longitude: null }
  }
}

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

    // Obtener todos los datos de Airtable (sin filtro por estado durante desarrollo)
    const records = await base("Soportes").select({
      // TODO: Activar filtro en producción: filterByFormula: `{Estado} = 'Disponible'`
    }).all()

    const soportes = records.map(r => {
      // Extraer coordenadas del enlace de Google Maps
      const googleMapsLink = r.fields['Enlace Google Maps']
      const coords = extractCoordinatesFromGoogleMapsLink(googleMapsLink)
      
      // Log para debug de tipos de soporte
      console.log(`🔍 Soporte ${r.fields['Código']}: tipo_soporte = "${r.fields['Tipo de soporte']}"`)
      
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
        ubicacion_url: googleMapsLink,
        latitud: r.fields['Latitud'] ?? coords.latitude,
        longitud: r.fields['Longitud'] ?? coords.longitude,
        foto_url: r.fields['Imagen principal']?.[0]?.url,
        foto_url_2: r.fields['Imagen secundaria 1']?.[0]?.url,
        foto_url_3: r.fields['Imagen secundaria 2']?.[0]?.url,
        notas: r.fields['Dirección / Notas'],
        propietario: r.fields['Propietario'],
        descripcion: r.fields['Descripción'],
        iluminacion: r.fields['Iluminación']
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
      
      // Normalizar nombre de ciudad antes de enviarlo al frontend
      const normalizedCity = normalizeCityName(soporte.ciudad)
      
      // Usar coordenadas reales si están disponibles, si no usar las de la ciudad
      const coordinates = (soporte.latitud && soporte.longitud) 
        ? { lat: soporte.latitud, lng: soporte.longitud }
        : getCoordinatesFromCity(normalizedCity)
      
      const finalFormat = soporte.tipo_soporte || getFormatFromType(soporte.tipo_soporte)
      
      // Log para debug del format final
      console.log(`📋 Soporte ${soporte.codigo}: tipo_soporte="${soporte.tipo_soporte}" → format="${finalFormat}"`)
      
      return {
        id: soporte.id,
        name: soporte.titulo || soporte.codigo,
        image: images[0] || "/placeholder.svg?height=300&width=400",
        images: images.length > 0 ? images : ["/placeholder.svg?height=300&width=400"],
        monthlyPrice: soporte.precio_mes || 0,
        location: soporte.notas || `${normalizedCity}, Bolivia`,
        city: normalizedCity,
        format: finalFormat,
        type: getTypeFromType(soporte.tipo_soporte),
        dimensions: `${soporte.ancho || 0}m x ${soporte.alto || 0}m`,
        visibility: getVisibilityFromType(soporte.tipo_soporte),
        traffic: soporte.impactos_diarios ? `${soporte.impactos_diarios.toLocaleString()} personas/día` : 'Variable',
        lighting: (() => {
          // El campo Iluminación es un checkbox en Airtable
          // Marcado (true) = "Sí", Sin marcar (false/null/undefined) = "No"
          if (typeof soporte.iluminacion === 'boolean') {
            return soporte.iluminacion ? 'Sí' : 'No'
          }
          // Si el campo no está definido (checkbox sin marcar en Airtable)
          if (soporte.iluminacion === null || soporte.iluminacion === undefined) {
            return 'No'
          }
          // Fallback para valores de texto antiguos (por compatibilidad)
          const ilumStr = String(soporte.iluminacion).toLowerCase().trim()
          if (ilumStr === 'iluminada' || ilumStr === 'sí' || ilumStr === 'si' || ilumStr === 'true' || ilumStr === '1') {
            return 'Sí'
          }
          return 'No'
        })(),
        description: soporte.descripcion || '',
        status: soporte.estado || 'Disponible',
        available: soporte.estado === 'Disponible',
        availableMonths: generateAvailableMonths(),
        features: getFeaturesFromType(soporte.tipo_soporte),
        coordinates,
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
  if (!tipo) return 'Vallas Publicitarias'
  const tipoLower = tipo.toLowerCase()
  
  const formatMap: Record<string, string> = {
    'pantallas led': 'Pantallas LED',
    'pantalla led': 'Pantallas LED',
    'vallas publicitarias': 'Vallas Publicitarias',
    'valla': 'Vallas Publicitarias',
    'mural': 'Murales',           // Singular desde Airtable
    'murales': 'Murales',          // Plural desde web
    'publicidad móvil': 'Publicidad Móvil',
    'marquesina': 'Murales',
    'monoposte': 'Vallas Publicitarias'
  }
  return formatMap[tipoLower] || 'Vallas Publicitarias'
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
    'Santa Cruz de la Sierra': [-17.7833, -63.1833],
    'Cochabamba': [-17.3833, -66.1667],
    'El Alto': [-16.5167, -68.1833],
    'Sucre': [-19.0500, -65.2500],
    'Potosi': [-19.5833, -65.7500],
    'Potosí': [-19.5833, -65.7500],
    'Tarija': [-21.5333, -64.7333],
    'Oruro': [-17.9833, -67.1500],
    'Beni': [-14.8333, -64.9000],
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
