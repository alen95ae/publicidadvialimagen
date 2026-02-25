import { getAllProductos } from '@/lib/supabaseProductos'

export const TIPOS_OFICIALES = [
  'Unipolar',
  'Bipolar',
  'Tripolar',
  'Mural',
  'Mega Valla',
  'Cartelera',
  'Paleta',
] as const
export type TipoOficial = typeof TIPOS_OFICIALES[number]

// Estados válidos en Airtable (con formato correcto)
export const ESTADOS_VALIDOS = [
  'Disponible',
  'Reservado',
  'Ocupado',
  'No disponible',
  'A Consultar'
] as const

export type EstadoValido = typeof ESTADOS_VALIDOS[number]

export function normalizeTipo(raw?: string): TipoOficial {
  if (!raw) return 'Unipolar'
  const v = String(raw).trim().toLowerCase()
  if (['unipolar','unipolares'].includes(v)) return 'Unipolar'
  if (['bipolar','bipolares'].includes(v)) return 'Bipolar'
  if (['tripolar','tripolares'].includes(v)) return 'Tripolar'
  if (['mural','murales'].includes(v)) return 'Mural'
  if (['mega valla','mega vallas','megavalla','megavallas'].includes(v)) return 'Mega Valla'
  if (['cartelera','carteleras'].includes(v)) return 'Cartelera'
  if (['paleta','paletas'].includes(v)) return 'Paleta'
  const eq = TIPOS_OFICIALES.find(t => t.toLowerCase() === v)
  return eq ?? 'Unipolar'
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
  if (['a consultar', 'a_consultar', 'aconsultar', 'consultar', 'to consult'].includes(v)) return 'A Consultar'
  
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

// Función para convertir de Supabase (snake_case) al formato del frontend
export function soporteToSupport(soporte: any) {
  // Manejar imágenes de Supabase (pueden ser arrays de objetos o strings)
  const extractImageUrl = (img: any): string | null => {
    if (!img) return null
    if (Array.isArray(img) && img.length > 0) {
      if (img[0]?.url) return img[0].url
      if (typeof img[0] === 'string') return img[0]
    }
    if (typeof img === 'string') return img
    return null
  }
  
  const images = [
    extractImageUrl(soporte.imagen_principal),
    extractImageUrl(soporte.imagen_secundaria_1),
    extractImageUrl(soporte.imagen_secundaria_2)
  ].filter(Boolean) as string[]
  
  const estado = normalizeEstado(soporte.estado)
  
  // Extraer coordenadas del enlace de Google Maps si no están disponibles
  let latitude = soporte.latitud ?? null
  let longitude = soporte.longitud ?? null
  
  if (!latitude || !longitude) {
    const googleMapsLink = soporte.enlace_maps
    if (googleMapsLink) {
      const coords = extractCoordinatesFromGoogleMapsLink(googleMapsLink)
      latitude = latitude ?? coords.latitude
      longitude = longitude ?? coords.longitude
    }
  }
  
  return {
    id: soporte.id?.toString() || '',
    code: soporte.codigo || '',
    title: soporte.titulo || '',
    type: normalizeTipo(soporte.tipo_soporte),
    status: estado,
    widthM: num(soporte.ancho),
    heightM: num(soporte.alto),
    areaM2: (() => {
      // SIEMPRE recalcular desde ancho × alto (ignorar valor guardado que puede estar incorrecto)
      const ancho = num(soporte.ancho) || 0
      const alto = num(soporte.alto) || 0
      // Calcular área: ancho × alto
      return ancho > 0 && alto > 0 ? ancho * alto : null
    })(),
    city: soporte.ciudad ?? null,
    zona: soporte.zona ?? null,
    country: soporte.pais ?? 'BO',
    priceMonth: num(soporte.precio_mensual),
    price3Months: num(soporte.precio_3_meses),
    price6Months: num(soporte.precio_6_meses),
    price12Months: num(soporte.precio_12_meses),
    impactosDiarios: soporte.impactos_diarios ?? null,
    googleMapsLink: soporte.enlace_maps ?? null,
    latitude,
    longitude,
    images,
    iluminacion: soporte.iluminacion ?? null,
    lighting: soporte.iluminacion === true ? 'Sí' : 'No',
    address: soporte.descripcion ?? null,
    owner: soporte.propietario ?? null,
    sustrato_id: soporte.sustrato ?? null,
    ownerId: null,
    available: estado === 'Disponible' || estado === 'A Consultar',
    createdAt: soporte.created_at || new Date().toISOString(),
    updatedAt: soporte.created_at || new Date().toISOString(),
    // Nuevos campos de costes
    duenoCasa: soporte.dueno_casa ?? null,
    temporalidadPago: soporte.temporalidad_pago ?? null,
    metodoPago: soporte.metodo_pago ?? null,
    estructura: soporte.estructura ?? null,
    costeAlquiler: num(soporte.coste_alquiler),
    patentes: num(soporte.patentes),
    usoSuelos: num(soporte.uso_suelos),
    luz: soporte.luz ?? null,
    gastosAdministrativos: num(soporte.gastos_administrativos),
    comisionEjecutiva: num(soporte.comision_ejecutiva),
    mantenimiento: num(soporte.mantenimiento),
    notas: soporte.notas ?? null,
  }
}

/** DB -> UI (Airtable format with accents) - MANTENER PARA COMPATIBILIDAD */
export function rowToSupport(row:any){
  // Si ya viene en formato Supabase (snake_case), usar la nueva función
  if (row.codigo !== undefined || row.titulo !== undefined) {
    return soporteToSupport(row)
  }
  
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
    available: estado === 'Disponible' || estado === 'A Consultar',
    createdAt: row['Fecha de creación'] || new Date().toISOString(),
    updatedAt: row['Última actualización'] || new Date().toISOString(),
  }
}

/** UI -> Supabase (formato snake_case) */
export async function buildSupabasePayload(data: any, existing?: any) {
  const payload: any = {}

  if (data.code !== undefined) payload.codigo = String(data.code).trim()
  if (data.title !== undefined) payload.titulo = String(data.title)
  if (data.type !== undefined) payload.tipo_soporte = normalizeTipo(data.type)
  else if (existing?.tipo_soporte) payload.tipo_soporte = existing.tipo_soporte

  const w = num(data.widthM ?? existing?.ancho)
  const h = num(data.heightM ?? existing?.alto)
  if (w !== null) payload.ancho = w
  if (h !== null) payload.alto = h
  
  // Calcular área total: ancho × alto
  if (w !== null && h !== null) {
    const areaCalculada = parseFloat((w * h).toFixed(2))
    payload.area_total_calculada = areaCalculada
    // También actualizar area_total si viene en data
    if (data.areaM2 !== undefined) {
      const areaFromData = num(data.areaM2)
      payload.area_total = areaFromData !== null ? parseFloat(areaFromData.toFixed(2)) : areaCalculada
    } else {
      payload.area_total = areaCalculada
    }
  }

  // Estado normalizado
  if (data.status !== undefined) {
    payload.estado = normalizeEstado(data.status)
  } else if (existing?.estado) {
    payload.estado = normalizeEstado(existing.estado)
  }

  if (data.city !== undefined) payload.ciudad = data.city || null
  if (data.country !== undefined) payload.pais = data.country || 'BO'
  if (data.priceMonth !== undefined) payload.precio_mensual = num(data.priceMonth)
  if (data.price3Months !== undefined) payload.precio_3_meses = num(data.price3Months)
  if (data.price6Months !== undefined) payload.precio_6_meses = num(data.price6Months)
  if (data.price12Months !== undefined) payload.precio_12_meses = num(data.price12Months)
  if (data.impactosDiarios !== undefined) payload.impactos_diarios = data.impactosDiarios ?? null
  if (data.googleMapsLink !== undefined) payload.enlace_maps = data.googleMapsLink || null
  if (data.description !== undefined) payload.descripcion = data.description || null
  if (data.address !== undefined) payload.descripcion = data.address || null
  if (data.zona !== undefined) payload.zona = data.zona || null
  
  // Sustrato: usar el seleccionado o el por defecto
  if (data.sustrato_id !== undefined && data.sustrato_id !== null && data.sustrato_id !== '') {
    payload.sustrato = data.sustrato_id
    console.log('✅ Usando sustrato seleccionado:', data.sustrato_id)
  } else {
    // Si no hay sustrato seleccionado, usar el por defecto
    console.log('🔍 No hay sustrato seleccionado, buscando sustrato por defecto...')
    const sustratoDefaultId = await getSustratoDefaultId()
    if (sustratoDefaultId) {
      payload.sustrato = sustratoDefaultId
      console.log('✅ Usando sustrato por defecto:', sustratoDefaultId)
    } else {
      console.warn('⚠️ No se pudo obtener sustrato por defecto, dejando null')
      payload.sustrato = null
    }
  }
  
  // Validar y manejar coordenadas correctamente
  if (data.latitude !== undefined) {
    const lat = typeof data.latitude === 'number' && !isNaN(data.latitude) ? data.latitude : null
    if (lat !== null) payload.latitud = lat
  }
  if (data.longitude !== undefined) {
    const lng = typeof data.longitude === 'number' && !isNaN(data.longitude) ? data.longitude : null
    if (lng !== null) payload.longitud = lng
  }
  
  if (data.iluminacion !== undefined) payload.iluminacion = data.iluminacion === true || data.iluminacion === 'Sí'
  else if (existing?.iluminacion !== undefined) payload.iluminacion = existing.iluminacion
  
  if (data.owner !== undefined) payload.propietario = data.owner || null

  // Campos de costes
  if (data.duenoCasa !== undefined) payload.dueno_casa = data.duenoCasa || null
  if (data.temporalidadPago !== undefined) payload.temporalidad_pago = data.temporalidadPago || null
  if (data.metodoPago !== undefined) payload.metodo_pago = data.metodoPago || null
  if (data.estructura !== undefined) payload.estructura = data.estructura || null
  if (data.costeAlquiler !== undefined) payload.coste_alquiler = num(data.costeAlquiler)
  if (data.patentes !== undefined) payload.patentes = num(data.patentes)
  if (data.usoSuelos !== undefined) payload.uso_suelos = num(data.usoSuelos)
  if (data.luz !== undefined) payload.luz = data.luz || null
  if (data.gastosAdministrativos !== undefined) payload.gastos_administrativos = num(data.gastosAdministrativos)
  if (data.comisionEjecutiva !== undefined) payload.comision_ejecutiva = num(data.comisionEjecutiva)
  if (data.mantenimiento !== undefined) payload.mantenimiento = num(data.mantenimiento)
  if (data.notas !== undefined) payload.notas = data.notas || null

  // Manejar imágenes (formato JSONB array para Supabase)
  if (data.images !== undefined && Array.isArray(data.images)) {
    if (data.images[0]) {
      payload.imagen_principal = [{ url: data.images[0] }]
    }
    if (data.images[1]) {
      payload.imagen_secundaria_1 = [{ url: data.images[1] }]
    }
    if (data.images[2]) {
      payload.imagen_secundaria_2 = [{ url: data.images[2] }]
    }
  }

  return payload
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
  
  // Validar y manejar coordenadas correctamente
  if (data.latitude !== undefined) {
    const lat = typeof data.latitude === 'number' && !isNaN(data.latitude) ? data.latitude : null
    if (lat !== null) payload['Latitud'] = lat
  }
  if (data.longitude !== undefined) {
    const lng = typeof data.longitude === 'number' && !isNaN(data.longitude) ? data.longitude : null
    if (lng !== null) payload['Longitud'] = lng
  }
  
  // Nota: Iluminación no existe en Airtable, se omite
  // if (data.iluminacion !== undefined)        payload['Iluminación'] = data.iluminacion
  
  // Nota: Dirección/Notas no existe en Airtable, se omite
  // if (data.address !== undefined)            payload['Dirección / Notas'] = data.address || null
  
  if (data.owner !== undefined)              payload['Propietario'] = data.owner || null

  // Nota: Área total se calcula automáticamente en Airtable
  // Nota: Los campos de imágenes no existen en Airtable, se omiten
  // if (data.images !== undefined && Array.isArray(data.images)) {
  //   // Airtable requiere attachments en formato: [{ url: 'https://...' }]
  //   // Convertir URLs relativas a absolutas
  //   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
  //     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  //   
  //   const toAbsoluteUrl = (url: string) => {
  //     if (!url) return url
  //     if (url.startsWith('http://') || url.startsWith('https://')) return url
  //     return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  //   }
  //   
  //   if (data.images[0]) {
  //     payload['Imagen principal'] = [{ url: toAbsoluteUrl(data.images[0]) }]
  //   } else {
  //     payload['Imagen principal'] = []
  //   }
  //   
  //   if (data.images[1]) {
  //     payload['Imagen secundaria 1'] = [{ url: toAbsoluteUrl(data.images[1]) }]
  //   } else {
  //     payload['Imagen secundaria 1'] = []
  //   }
  //   
  //   if (data.images[2]) {
  //     payload['Imagen secundaria 2'] = [{ url: toAbsoluteUrl(data.images[2]) }]
  //   } else {
  //     payload['Imagen secundaria 2'] = []
  //   }
  // }
  
  return payload
}

/** Si no hay propietario, asegura uno por defecto y devuelve su id */
export async function ensureDefaultOwnerId(): Promise<string> {
  // Esta función ya no es necesaria con Supabase
  // Si se necesita un propietario por defecto, debe crearse en Supabase
  return 'default-owner-id'
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

/** Mapea estado en español a código en inglés para Supabase */
export function mapStatusToSupabase(status: string): string {
  const statusMap: Record<string, string> = {
    'Disponible': 'available',
    'Reservado': 'reserved',
    'Ocupado': 'occupied',
    'No disponible': 'unavailable',
    'A Consultar': 'to_consult',
    'En mantenimiento': 'maintenance',
    'Mantenimiento': 'maintenance'
  }
  
  return statusMap[status] || 'unknown'
}

/** Obtener el ID del sustrato por defecto: "LONA 13 Oz + IMPRESIÓN" */
export async function getSustratoDefaultId(): Promise<string | null> {
  try {
    console.log('🔍 Buscando sustrato por defecto: LONA 13 Oz + IMPRESIÓN')
    // Obtener TODOS los productos para buscar sin límites de paginación
    const allProductos = await getAllProductos()
    console.log(`📦 Total productos encontrados: ${allProductos.length}`)
    
    // Buscar el producto por nombre (búsqueda flexible)
    const producto = allProductos.find((p: any) => {
      const nombreUpper = (p.nombre || '').toUpperCase()
      const codigoUpper = (p.codigo || '').toUpperCase()
      
      // Buscar en nombre o código
      const match = (nombreUpper.includes('LONA') || codigoUpper.includes('LONA')) && 
                    (nombreUpper.includes('13') || codigoUpper.includes('13')) && 
                    (nombreUpper.includes('OZ') || nombreUpper.includes('OZ.') || codigoUpper.includes('OZ')) &&
                    (nombreUpper.includes('IMPRESIÓN') || nombreUpper.includes('IMPRESION') || nombreUpper.includes('IMPRESION'))
      
      if (match) {
        console.log(`✅ Producto sustrato encontrado: ${p.codigo} - ${p.nombre} (ID: ${p.id})`)
      }
      
      return match
    })
    
    if (!producto) {
      console.warn('⚠️ No se encontró el producto sustrato por defecto. Productos disponibles:')
      allProductos.slice(0, 10).forEach((p: any) => {
        console.log(`   - ${p.codigo} - ${p.nombre}`)
      })
    }
    
    return producto?.id || null
  } catch (error) {
    console.error('❌ Error obteniendo sustrato por defecto:', error)
    return null
  }
}
