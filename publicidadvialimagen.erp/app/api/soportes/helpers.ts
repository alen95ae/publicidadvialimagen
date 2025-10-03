import { airtable } from '@/lib/airtable'

export const TIPOS_OFICIALES = [
  'Vallas Publicitarias',
  'Pantallas LED',
  'Murales',
  'Publicidad Móvil',
] as const
export type TipoOficial = typeof TIPOS_OFICIALES[number]

const STATUS_TO_DB: Record<string,string> = {
  DISPONIBLE:'disponible',
  RESERVADO:'reservado',
  OCUPADO:'ocupado',
  NO_DISPONIBLE:'no_disponible',
}
const STATUS_FROM_DB: Record<string,string> = {
  disponible:'DISPONIBLE',
  reservado:'RESERVADO',
  ocupado:'OCUPADO',
  no_disponible:'NO_DISPONIBLE',
}

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

export function uiToDbStatus(ui?: string) {
  if (!ui) return 'disponible'
  return STATUS_TO_DB[(ui||'').toUpperCase()] || 'disponible'
}
export function dbToUiStatus(db?: string|null) {
  if (!db) return 'DISPONIBLE'
  return STATUS_FROM_DB[String(db).toLowerCase()] || 'DISPONIBLE'
}

export function mapStatusToSupabase(status: string): string {
  return uiToDbStatus(status)
}

/** DB -> UI (Airtable format with accents) */
export function rowToSupport(row:any){
  // Manejar imágenes de Airtable (arrays de attachments)
  console.log('🔍 Leyendo imágenes desde Airtable para soporte:', row['Código'])
  console.log('  - Imagen principal:', row['Imagen principal'])
  console.log('  - Imagen secundaria 1:', row['Imagen secundaria 1'])
  console.log('  - Imagen secundaria 2:', row['Imagen secundaria 2'])
  
  const images = [
    row['Imagen principal']?.[0]?.url,
    row['Imagen secundaria 1']?.[0]?.url,
    row['Imagen secundaria 2']?.[0]?.url
  ].filter(Boolean)
  
  console.log('📸 URLs de imágenes extraídas:', images)
  
  return {
    id: row.id,
    code: row['Código'] || '',
    title: row['Título'] || '',
    type: normalizeTipo(row['Tipo de soporte']),
    status: (row['Estado'] || 'DISPONIBLE').toUpperCase(),
    widthM: num(row['Ancho']),
    heightM: num(row['Alto']),
    areaM2: num(row['Área total']),
    city: row['Ciudad'] ?? null,
    country: row['País'] ?? 'BO',
    priceMonth: num(row['Precio por mes']),
    impactosDiarios: row['Impactos diarios'] ?? null,
    googleMapsLink: row['Enlace Google Maps'] ?? null,
    latitude: row['Latitud'] ?? null,
    longitude: row['Longitud'] ?? null,
    images,
    iluminacion: row['Iluminación'] ?? null,
    address: row['Dirección / Notas'] ?? null,
    owner: row['Propietario'] ?? null,
    ownerId: null, // Airtable no usa IDs de propietario de la misma forma
    available: (row['Estado'] || '').toUpperCase() === 'DISPONIBLE',
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

  // Estado en mayúsculas para Airtable
  if (data.status !== undefined) {
    payload['Estado'] = String(data.status).toUpperCase()
  } else if (existing?.Estado) {
    payload['Estado'] = existing.Estado
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
    
    console.log('🖼️ Procesando imágenes para Airtable:', data.images)
    console.log('🌐 Base URL:', baseUrl)
    
    const toAbsoluteUrl = (url: string) => {
      if (!url) return url
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    }
    
    if (data.images[0]) {
      const absUrl = toAbsoluteUrl(data.images[0])
      console.log('📸 Imagen principal:', absUrl)
      payload['Imagen principal'] = [{ url: absUrl }]
    } else {
      payload['Imagen principal'] = []
    }
    
    if (data.images[1]) {
      const absUrl = toAbsoluteUrl(data.images[1])
      console.log('📸 Imagen secundaria 1:', absUrl)
      payload['Imagen secundaria 1'] = [{ url: absUrl }]
    } else {
      payload['Imagen secundaria 1'] = []
    }
    
    if (data.images[2]) {
      const absUrl = toAbsoluteUrl(data.images[2])
      console.log('📸 Imagen secundaria 2:', absUrl)
      payload['Imagen secundaria 2'] = [{ url: absUrl }]
    } else {
      payload['Imagen secundaria 2'] = []
    }
    
    console.log('✅ Payload de imágenes construido:', {
      'Imagen principal': payload['Imagen principal'],
      'Imagen secundaria 1': payload['Imagen secundaria 1'],
      'Imagen secundaria 2': payload['Imagen secundaria 2']
    })
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
