export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getAllSoportes } from '@/lib/supabaseSoportes'

/** Normalizar nombres de ciudades para mantener consistencia en la web */
function normalizeCityName(ciudad: string | undefined): string {
  if (!ciudad) return 'Bolivia'
  
  const cityMap: Record<string, string> = {
    // Santa Cruz
    'Santa Cruz': 'Santa Cruz',
    'Santa Cruz de la Sierra': 'Santa Cruz',
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
      const lat = parseFloat(searchMatch[1])
      const lng = parseFloat(searchMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    // Patrón 2: @-16.123,-68.456 o @-16.123,-68.456,zoom
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,(\d+[zm]))?/
    const atMatch = link.match(atPattern)
    if (atMatch) {
      const lat = parseFloat(atMatch[1])
      const lng = parseFloat(atMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    // Patrón 3: ?q=-16.123,-68.456
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const qMatch = link.match(qPattern)
    if (qMatch) {
      const lat = parseFloat(qMatch[1])
      const lng = parseFloat(qMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    // Patrón 4: ll=-16.123,-68.456
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const llMatch = link.match(llPattern)
    if (llMatch) {
      const lat = parseFloat(llMatch[1])
      const lng = parseFloat(llMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    // Patrón 5: !3d-16.123!4d-68.456
    const dPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/
    const dMatch = link.match(dPattern)
    if (dMatch) {
      const lat = parseFloat(dMatch[1])
      const lng = parseFloat(dMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    // Patrón 6: place_id o place/ con coordenadas en la URL
    const placePattern = /place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const placeMatch = link.match(placePattern)
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1])
      const lng = parseFloat(placeMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    // Patrón 7: /data=!4m2!3m1!1s... con coordenadas en parámetros
    const dataPattern = /data=.*?(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const dataMatch = link.match(dataPattern)
    if (dataMatch) {
      const lat = parseFloat(dataMatch[1])
      const lng = parseFloat(dataMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { latitude: lat, longitude: lng }
      }
    }
    
    return { latitude: null, longitude: null }
  } catch (error) {
    console.error('Error extrayendo coordenadas de enlace:', link, error)
    return { latitude: null, longitude: null }
  }
}

export async function GET(req: Request) {
  try {
    console.log('📥 [GET /api/soportes] Iniciando petición...')
    
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const city = searchParams.get('city')
    const format = searchParams.get('format')
    const type = searchParams.get('type')
    const availability = searchParams.get('availability')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    // Obtener todos los datos de Supabase
    // Esta es una ruta pública, no requiere autenticación
    let result
    try {
      console.log('🔍 [GET /api/soportes] Llamando a getAllSoportes()...')
      result = await getAllSoportes()
      console.log('✅ [GET /api/soportes] getAllSoportes() completado. Resultado:', {
        hasResult: !!result,
        hasRecords: !!(result?.records),
        recordsLength: result?.records?.length || 0
      })
    } catch (error: any) {
      console.error('❌ [GET /api/soportes] Error en getAllSoportes:', error)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      console.error('Error hint:', error?.hint)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // Si es un error de RLS o permisos, devolver un error más descriptivo
      if (error?.code === '42501' || error?.message?.includes('permission denied') || error?.message?.includes('RLS')) {
        return NextResponse.json({ 
          error: 'Error de permisos al acceder a los soportes',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 403 })
      }
      
      // Re-lanzar el error para que se maneje en el catch general
      throw error
    }

    // Validar que result tenga la estructura esperada
    if (!result || typeof result !== 'object') {
      console.error('❌ [GET /api/soportes] getAllSoportes retornó un resultado inválido:', result)
      return NextResponse.json({ 
        error: 'Error al obtener los soportes: formato de respuesta inválido',
        details: process.env.NODE_ENV === 'development' ? 'result no es un objeto' : undefined
      }, { status: 500 })
    }

    if (!result.records || !Array.isArray(result.records)) {
      console.error('❌ [GET /api/soportes] getAllSoportes retornó records inválido:', result.records)
      return NextResponse.json({ 
        error: 'Error al obtener los soportes: formato de datos inválido',
        details: process.env.NODE_ENV === 'development' ? 'result.records no es un array' : undefined
      }, { status: 500 })
    }

    console.log(`📊 [GET /api/soportes] Procesando ${result.records.length} registros...`)
    const soportes = result.records
      .filter(r => r && r.fields && r.id) // Filtrar registros inválidos
      .map(r => {
        try {
          // Extraer coordenadas del enlace de Google Maps
          const googleMapsLink = r.fields?.['Enlace Google Maps'] || null
          const coords = extractCoordinatesFromGoogleMapsLink(googleMapsLink)
          
          // Log para debug de tipos de soporte (solo en desarrollo)
          if (process.env.NODE_ENV === 'development' && r.fields?.['Código']) {
            console.log(`🔍 Soporte ${r.fields['Código']}: tipo_soporte = "${r.fields['Tipo de soporte']}"`)
          }
          
          // Log para debug de coordenadas (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            const hasStoredCoords = r.fields?.['Latitud'] && r.fields?.['Longitud']
            const hasExtractedCoords = coords.latitude && coords.longitude
            if (googleMapsLink && !hasStoredCoords && !hasExtractedCoords) {
              console.warn(`⚠️ Soporte ${r.fields?.['Código']}: Tiene enlace Google Maps pero no se pudieron extraer coordenadas:`, googleMapsLink.substring(0, 100))
            } else if (googleMapsLink && !hasStoredCoords && hasExtractedCoords) {
              console.log(`✅ Soporte ${r.fields?.['Código']}: Coordenadas extraídas del enlace: ${coords.latitude}, ${coords.longitude}`)
            }
          }
          
          // Extraer imágenes de forma segura
          const extractImageUrl = (imageField: any): string | null => {
            if (!imageField) return null
            if (Array.isArray(imageField) && imageField.length > 0) {
              if (imageField[0]?.url) return imageField[0].url
              if (typeof imageField[0] === 'string') return imageField[0]
            }
            if (typeof imageField === 'string') return imageField
            return null
          }
          
          const soporte = {
            id: r.id,
            codigo: r.fields?.['Código'] || '',
            titulo: r.fields?.['Título'] || '',
            tipo_soporte: r.fields?.['Tipo de soporte'] || '',
            estado: r.fields?.['Estado'] || 'Disponible',
            ancho: r.fields?.['Ancho'] || null,
            alto: r.fields?.['Alto'] || null,
            ciudad: r.fields?.['Ciudad'] || null,
            precio_mes: r.fields?.['Precio por mes'] || null,
            impactos_diarios: r.fields?.['Impactos diarios'] || null,
            ubicacion_url: googleMapsLink,
            latitud: r.fields?.['Latitud'] ?? coords.latitude ?? null,
            longitud: r.fields?.['Longitud'] ?? coords.longitude ?? null,
            // Preparado para imágenes: extraer URL del array JSONB de forma segura
            foto_url: extractImageUrl(r.fields?.['Imagen principal']),
            foto_url_2: extractImageUrl(r.fields?.['Imagen secundaria 1']),
            foto_url_3: extractImageUrl(r.fields?.['Imagen secundaria 2']),
            notas: r.fields?.['Dirección / Notas'] || null,
            propietario: r.fields?.['Propietario'] || null,
            descripcion: r.fields?.['Descripción'] || null,
            iluminacion: r.fields?.['Iluminación'] ?? false
          }
          
          // Log de imágenes para depuración (solo en desarrollo)
          if (process.env.NODE_ENV === 'development' && (soporte.foto_url || soporte.foto_url_2 || soporte.foto_url_3)) {
            console.log(`📸 Imágenes en soporte ${soporte.codigo}:`, {
              principal: soporte.foto_url ? '✅' : '❌',
              secundaria1: soporte.foto_url_2 ? '✅' : '❌',
              secundaria2: soporte.foto_url_3 ? '✅' : '❌'
            })
          }
          
          return soporte
        } catch (err) {
          console.error(`Error procesando soporte ${r.id}:`, err)
          // Retornar un objeto mínimo válido para no romper el flujo
          return {
            id: r.id,
            codigo: r.fields?.['Código'] || '',
            titulo: r.fields?.['Título'] || '',
            tipo_soporte: r.fields?.['Tipo de soporte'] || '',
            estado: 'Disponible',
            ancho: null,
            alto: null,
            ciudad: null,
            precio_mes: null,
            impactos_diarios: null,
            ubicacion_url: null,
            latitud: null,
            longitud: null,
            foto_url: null,
            foto_url_2: null,
            foto_url_3: null,
            notas: null,
            propietario: null,
            descripcion: null,
            iluminacion: false
          }
        }
      })
      .filter(s => s && s.id) // Filtrar soportes inválidos después del mapeo

    console.log(`✅ [GET /api/soportes] ${soportes.length} soportes procesados correctamente`)

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
    const transformedSoportes = (filteredSoportes || [])
      .filter(s => s && s.id) // Filtrar soportes inválidos antes de transformar
      .map(soporte => {
        try {
          // Recopilar todas las imágenes disponibles
          const images = [
            soporte.foto_url,
            soporte.foto_url_2,
            soporte.foto_url_3
          ].filter(Boolean)
          
          // Log de imágenes solo en desarrollo
          if (process.env.NODE_ENV === 'development') {
            console.log(`🖼️ Soporte ${soporte.codigo} - ${images.length} imágenes:`, images.length > 0 ? images : 'Sin imágenes')
          }
          
          // Normalizar nombre de ciudad antes de enviarlo al frontend
          const normalizedCity = normalizeCityName(soporte.ciudad)
          
          // Usar coordenadas reales si están disponibles, si no usar las de la ciudad
          let coordinates: { lat: number, lng: number } | undefined = undefined
          try {
            if (soporte.latitud && soporte.longitud && 
                !isNaN(Number(soporte.latitud)) && !isNaN(Number(soporte.longitud)) &&
                Math.abs(Number(soporte.latitud)) <= 90 && Math.abs(Number(soporte.longitud)) <= 180) {
              coordinates = { lat: Number(soporte.latitud), lng: Number(soporte.longitud) }
            } else {
              // Log si no tiene coordenadas válidas (solo en desarrollo)
              if (process.env.NODE_ENV === 'development' && soporte.ubicacion_url && !soporte.latitud && !soporte.longitud) {
                console.warn(`⚠️ Soporte ${soporte.codigo} (${soporte.titulo}): Tiene enlace Google Maps pero no coordenadas válidas. Usando coordenadas de ciudad: ${normalizedCity}`)
              }
              const cityCoords = getCoordinatesFromCity(normalizedCity)
              if (cityCoords && Array.isArray(cityCoords) && cityCoords.length >= 2) {
                coordinates = { lat: cityCoords[0], lng: cityCoords[1] }
              }
            }
          } catch (coordError) {
            console.error(`Error procesando coordenadas para soporte ${soporte.codigo}:`, coordError)
            // Continuar sin coordenadas
          }
          
          const finalFormat = soporte.tipo_soporte ? getFormatFromType(soporte.tipo_soporte) : 'Vallas Publicitarias'
          
          // Log para debug del format final (solo en desarrollo)
          if (process.env.NODE_ENV === 'development') {
            console.log(`📋 Soporte ${soporte.codigo}: tipo_soporte="${soporte.tipo_soporte}" → format="${finalFormat}"`)
          }
          
          return {
            id: soporte.id || '',
            code: soporte.codigo || soporte.id || '', // Código del soporte (ej: "34-LPZ")
            name: soporte.titulo || soporte.codigo || 'Soporte sin nombre',
            image: images[0] || "/placeholder.svg?height=300&width=400",
            images: images.length > 0 ? images : ["/placeholder.svg?height=300&width=400"],
            monthlyPrice: soporte.precio_mes || 0,
            location: soporte.notas || `${normalizedCity}, Bolivia`,
            city: normalizedCity,
            format: finalFormat,
            type: getTypeFromType(soporte.tipo_soporte),
            dimensions: `${soporte.ancho || 0}m x ${soporte.alto || 0}m`,
            visibility: getVisibilityFromType(soporte.tipo_soporte),
            traffic: soporte.impactos_diarios ? `${Number(soporte.impactos_diarios).toLocaleString()} personas/día` : 'Variable',
            lighting: (() => {
              try {
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
              } catch {
                return 'No'
              }
            })(),
            description: soporte.descripcion || '',
            status: soporte.estado || 'Disponible',
            available: soporte.estado === 'Disponible',
            availableMonths: generateAvailableMonths(),
            features: getFeaturesFromType(soporte.tipo_soporte),
            coordinates,
          }
        } catch (transformError) {
          console.error(`Error transformando soporte ${soporte?.id}:`, transformError)
          // Retornar un objeto mínimo válido
          return {
            id: soporte?.id || '',
            code: soporte?.codigo || soporte?.id || '',
            name: soporte?.titulo || 'Soporte sin nombre',
            image: "/placeholder.svg?height=300&width=400",
            images: ["/placeholder.svg?height=300&width=400"],
            monthlyPrice: 0,
            location: 'Ubicación no especificada',
            city: normalizeCityName(soporte?.ciudad),
            format: 'Vallas Publicitarias',
            type: 'Estándar',
            dimensions: '0m x 0m',
            visibility: 'Alto tráfico',
            traffic: 'Variable',
            lighting: 'No',
            description: '',
            status: 'Disponible',
            available: true,
            availableMonths: generateAvailableMonths(),
            features: [],
            coordinates: undefined,
          }
        }
      })
      .filter(item => item && item.id) // Filtrar items que fallaron completamente

    console.log(`✅ [GET /api/soportes] ${transformedSoportes.length} soportes transformados. Retornando respuesta...`)

    const res = NextResponse.json({
      data: transformedSoportes,
      pagination: {
        page,
        limit,
        total: transformedSoportes.length,
        hasNext: transformedSoportes.length === limit,
        hasPrev: page > 1
      }
    })
    // Cache CDN seguro para endpoint público (reduce CPU). No cambia payload ni lógica.
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    return res

  } catch (error: any) {
    console.error('❌ Error in soportes API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    
    try {
      console.error('Error details:', JSON.stringify(error, null, 2))
    } catch (stringifyError) {
      console.error('Error al serializar error:', stringifyError)
    }
    
    // Determinar el código de estado apropiado
    let statusCode = 500
    let errorMessage = 'Error interno del servidor'
    
    if (error?.code === '42501' || error?.message?.includes('permission denied')) {
      statusCode = 403
      errorMessage = 'Error de permisos al acceder a los soportes'
    } else if (error?.code === 'PGRST116' || error?.message?.includes('JWT')) {
      statusCode = 401
      errorMessage = 'Error de autenticación'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    // Intentar devolver respuesta JSON válida
    try {
      return NextResponse.json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error),
          code: error?.code,
          hint: error?.hint,
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      }, { status: statusCode })
    } catch (jsonError) {
      // Si falla la creación de JSON, devolver respuesta simple
      console.error('Error creando respuesta JSON:', jsonError)
      return new NextResponse(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

// Funciones auxiliares para transformar datos (adaptadas para Airtable)
function getFormatFromType(tipo?: string): string {
  if (!tipo) return 'Vallas Publicitarias'
  const tipoLower = tipo.toLowerCase().trim()
  
  const formatMap: Record<string, string> = {
    // Pantallas LED
    'pantallas led': 'Pantallas LED',
    'pantalla led': 'Pantallas LED',
    // Vallas Publicitarias (Unipolar, Bipolar, Tripolar, Mega Valla, Cartelera, Paleta)
    'vallas publicitarias': 'Vallas Publicitarias',
    'valla': 'Vallas Publicitarias',
    'unipolar': 'Unipolar',
    'bipolar': 'Bipolar',
    'tripolar': 'Tripolar',
    'mega valla': 'Mega Valla',
    'megavalla': 'Mega Valla',
    'cartelera': 'Cartelera',
    'paleta': 'Paleta',
    'monoposte': 'Vallas Publicitarias',
    // Murales
    'mural': 'Mural',
    'murales': 'Mural',
    'marquesina': 'Mural',
    // Publicidad Móvil
    'publicidad móvil': 'Publicidad Móvil',
    'publicidad movil': 'Publicidad Móvil',
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
