import { airtable } from '@/lib/airtable'

export const TIPOS_OFICIALES = [
  'Vallas Publicitarias',
  'Pantallas LED',
  'Murales',
  'Publicidad Móvil',
] as const
export type TipoOficial = typeof TIPOS_OFICIALES[number]

// Estados válidos en Airtable (con formato correcto)
export const ESTADOS_VALIDOS = [
  'Disponible',
  'Reservado',
  'Ocupado',
  'No disponible'
] as const

export type EstadoValido = typeof ESTADOS_VALIDOS[number]

export function normalizeTipo(raw?: string): TipoOficial {
  if (!raw) return 'Vallas Publicitarias'
  const v = String(raw).trim().toLowerCase()
  if (['valla','vallas','vallas publicitarias','bipolar','unipolar','tripular','mega valla','caminera'].includes(v)) return 'Vallas Publicitarias'
  if (['pantalla','pantalla led','pantallas led','pantalla_led','led'].includes(v)) return 'Pantallas LED'
  if (['mural','murales','marquesina'].includes(v)) return 'Murales'
  if (['publicidad movil','publicidad móvil','movil','móvil','mobile','pasacalles','otro'].includes(v)) return 'Publicidad Móvil'
  const eq = TIPOS_OFICIALES.find(t => t.toLowerCase() === v)
  return eq ?? 'Vallas Publicitarias'
}

const num = (val:any): number | null => {
  if (val===undefined || val===null || val==='') return null
  let s = String(val).trim().replace(/[€$Bs\s]/gi,'')
  if (s.includes(',')) s = s.replace(/\./g,'').replace(',','.')
  s = s.replace(/[^0-9+\-.]/g,'')
  if (!s || s==='-' || s==='.' || s==='-.') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Normalizar estado al formato correcto de Airtable */
export function normalizeEstado(raw?: string): EstadoValido {
  if (!raw) return 'Disponible'
  const v = String(raw).trim().toLowerCase()
  
  // Mapear variaciones comunes
  if (['disponible', 'available', 'libre', 'free'].includes(v)) return 'Disponible'
  if (['reservado', 'reserved', 'reserva'].includes(v)) return 'Reservado'
  if (['ocupado', 'occupied', 'busy', 'en uso'].includes(v)) return 'Ocupado'
  if (['no disponible', 'no_disponible', 'nodisponible', 'unavailable', 'bloqueado'].includes(v)) return 'No disponible'
  
  // Buscar coincidencia exacta (case-insensitive)
  const exact = ESTADOS_VALIDOS.find(e => e.toLowerCase() === v)
  return exact ?? 'Disponible'
}

/** Extraer coordenadas de un enlace de Google Maps */
export function extractCoordinatesFromGoogleMapsLink(link?: string): { latitude: number | null, longitude: number | null } {
  if (!link) return { latitude: null, longitude: null }
  
  try {
    // Patrón 1: /search/-16.498835,+-68.164877 o /search/-16.498835,-68.164877
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

/** DB -> UI (Airtable format with accents) */
export function rowToSupport(row:any){
  // Manejar imágenes de Airtable (arrays de attachments)
  const images = [
    row['Imagen principal']?.[0]?.url,
    row['Imagen secundaria 1']?.[0]?.url,
    row['Imagen secundaria 2']?.[0]?.url
  ].filter(Boolean)
  
  const estado = normalizeEstado(row['Estado'])
  
  // Extraer coordenadas del enlace de Google Maps si no están disponibles en los campos
  let latitude = row['Latitud'] ?? null
  let longitude = row['Longitud'] ?? null
  
  if (!latitude || !longitude) {
    const googleMapsLink = row['Enlace Google Maps']
    if (googleMapsLink) {
      const coords = extractCoordinatesFromGoogleMapsLink(googleMapsLink)
      latitude = latitude ?? coords.latitude
      longitude = longitude ?? coords.longitude
    }
  }
  
  return {
    id: row.id,
    code: row['Código'] || '',
    title: row['Título'] || '',
    type: normalizeTipo(row['Tipo de soporte']),
    status: estado,
    widthM: num(row['Ancho']),
    heightM: num(row['Alto']),
    areaM2: num(row['Área total']),
    city: row['Ciudad'] ?? null,
    country: row['País'] ?? 'BO',
    priceMonth: num(row['Precio por mes']),
    impactosDiarios: row['Impactos diarios'] ?? null,
    googleMapsLink: row['Enlace Google Maps'] ?? null,
    latitude,
    longitude,
    images,
    iluminacion: row['Iluminación'] ?? null,
    lighting: (() => {
      const iluminacionValue = row['Iluminación']
      console.log(`🔍 Airtable - Soporte ${row['Código']}: Iluminación = ${iluminacionValue} (tipo: ${typeof iluminacionValue})`)
      return iluminacionValue === true ? 'Sí' : 'No'
    })(), // Mapear checkbox de iluminación
    address: row['Dirección / Notas'] ?? null,
    owner: row['Propietario'] ?? null,
    ownerId: null, // Airtable no usa IDs de propietario de la misma forma
    available: estado === 'Disponible',
    createdAt: row['Fecha de creación'] || new Date().toISOString(),
    updatedAt: row['Última actualización'] || new Date().toISOString(),
  }
}

/** UI -> Airtable (con nombres de campos en español con tildes) */
export function buildPayload(data:any, existing?:any){
  const payload:any = {}

  if (data.code !== undefined)         payload['Código'] = String(data.code).trim()
  if (data.title !== undefined)        payload['Título'] = String(data.title)
  if (data.type !== undefined)         payload['Tipo de soporte'] = normalizeTipo(data.type)
  else if (existing?.['Tipo de soporte']) payload['Tipo de soporte'] = existing['Tipo de soporte']

  const w = num(data.widthM ?? existing?.Ancho)
  const h = num(data.heightM ?? existing?.Alto)
  if (w !== null) payload['Ancho'] = w
  if (h !== null) payload['Alto'] = h

  // Estado normalizado al formato de Airtable
  if (data.status !== undefined) {
    payload['Estado'] = normalizeEstado(data.status)
  } else if (existing?.Estado) {
    payload['Estado'] = normalizeEstado(existing.Estado)
  }

  if (data.city !== undefined)               payload['Ciudad'] = data.city || null
  if (data.country !== undefined)            payload['País'] = data.country || 'BO'
  if (data.priceMonth !== undefined)         payload['Precio por mes'] = num(data.priceMonth)
  if (data.impactosDiarios !== undefined)    payload['Impactos diarios'] = data.impactosDiarios ?? null
  if (data.googleMapsLink !== undefined)     payload['Enlace Google Maps'] = data.googleMapsLink || null
  if (data.latitude !== undefined)           payload['Latitud'] = data.latitude
  if (data.longitude !== undefined)          payload['Longitud'] = data.longitude
  if (data.iluminacion !== undefined)        payload['Iluminación'] = data.iluminacion
  if (data.address !== undefined)            payload['Dirección / Notas'] = data.address || null
  if (data.owner !== undefined)              payload['Propietario'] = data.owner || null

  // Nota: Área total se calcula automáticamente en Airtable
  // Las imágenes en Airtable son attachments y requieren manejo especial
  if (data.images !== undefined && Array.isArray(data.images)) {
    // Airtable requiere attachments en formato: [{ url: 'https://...' }]
    // Convertir URLs relativas a absolutas
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    const toAbsoluteUrl = (url: string) => {
      if (!url) return url
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    }
    
    if (data.images[0]) {
      payload['Imagen principal'] = [{ url: toAbsoluteUrl(data.images[0]) }]
    } else {
      payload['Imagen principal'] = []
    }
    
    if (data.images[1]) {
      payload['Imagen secundaria 1'] = [{ url: toAbsoluteUrl(data.images[1]) }]
    } else {
      payload['Imagen secundaria 1'] = []
    }
    
    if (data.images[2]) {
      payload['Imagen secundaria 2'] = [{ url: toAbsoluteUrl(data.images[2]) }]
    } else {
      payload['Imagen secundaria 2'] = []
    }
  }
  
  return payload
}

/** Si no hay propietario, asegura uno por defecto y devuelve su id */
export async function ensureDefaultOwnerId(): Promise<string> {
  try {
    // Try to get existing default owner from Airtable
    const response = await airtable('Dueños de Casa').select({
      filterByFormula: `{Nombre} = 'Propietario por Defecto'`,
      maxRecords: 1
    }).all()
    
    if (response && response.length > 0) {
      return response[0].id
    }
    
    // Create default owner if not exists
    const createResponse = await airtable('Dueños de Casa').create({
      'Nombre': 'Propietario por Defecto',
      'Tipo Propietario': 'empresa',
      'Estado': 'activo'
    })
    
    return createResponse.id
  } catch (error) {
    console.error('Error ensuring default owner:', error)
    return 'default-owner-id'
  }
}

/** Procesa datos de CSV para importación */
export function processCsvRow(row: any): any {
  return {
    code: row.Codigo || row.codigo,
    title: row.Titulo || row.titulo,
    type: row['Tipo Soporte'] || row.tipo_soporte || row.Tipo || row.tipo,
    status: row.Estado || row.estado || row.Disponibilidad || row.disponibilidad,
    widthM: num(row.Ancho || row.ancho),
    heightM: num(row.Alto || row.alto),
    city: row.Ciudad || row.ciudad,
    priceMonth: num(row['Precio por mes'] || row.precio_mes || row.Precio || row.precio),
    impactosDiarios: num(row['Impactos dia'] || row.impactos_dia || row.Impactos || row.impactos),
    googleMapsLink: row.Ubicación || row.ubicacion || row['Google Maps'] || row.google_maps,
    address: row.Notas || row.notas || row.Dirección || row.direccion,
    owner: row.Propietario || row.propietario,
  }
}
