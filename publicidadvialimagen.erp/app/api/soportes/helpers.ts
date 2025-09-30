import { supabaseServer } from '@/lib/supabaseServer'


const STATUS_TO_SUPABASE: Record<string, string> = {
  DISPONIBLE: 'disponible',
  RESERVADO: 'reservado',
  OCUPADO: 'ocupado',
  NO_DISPONIBLE: 'no_disponible',
}

const STATUS_FROM_SUPABASE: Record<string, string> = {
  disponible: 'DISPONIBLE',
  reservado: 'RESERVADO',
  ocupado: 'OCUPADO',
  no_disponible: 'NO_DISPONIBLE',
}

const toNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const toInteger = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  const num = parseInt(value, 10)
  return Number.isFinite(num) ? num : null
}

const nullIfEmpty = (value: any) => {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed.length ? trimmed : null
}

export function mapStatusToSupabase(status?: string) {
  if (!status) return 'disponible'
  const key = status.toUpperCase()
  return STATUS_TO_SUPABASE[key] || 'disponible'
}

export function mapStatusFromSupabase(status?: string | null) {
  if (!status) return 'DISPONIBLE'
  return STATUS_FROM_SUPABASE[status.toLowerCase()] || 'DISPONIBLE'
}


export function supabaseRowToSupport(row: any) {
  const statusValue = row?.estado ?? row?.Disponibilidad
  const status = mapStatusFromSupabase(statusValue)
  const images = [row?.foto_url || row?.foto_principal, row?.foto_url_2, row?.foto_url_3].filter(Boolean)

  const code = row?.codigo ?? row?.Codigo
  const title = row?.titulo ?? row?.Titulo ?? row?.nombre ?? row?.Nombre ?? ''
  const type = row?.tipo ?? row?.Tipo ?? ''
  const city = row?.ciudad ?? row?.Ciudad ?? ''
  const priceMonth = row?.precio_mes ?? row?.['Precio por mes']
  const width = row?.ancho ?? row?.Ancho
  const height = row?.alto ?? row?.Alto
  const impactos = row?.impactos_diarios ?? row?.['Impactos diarios']
  const googleMaps = row?.ubicacion_url ?? row?.Ubicacion ?? row?.Ubicación ?? null

  return {
    id: row.id,
    code: code,
    title: title,
    type: type,
    status,
    widthM: toNumber(width),
    heightM: toNumber(height),
    city: city,
    country: row.pais || 'Bolivia',
    priceMonth: toNumber(priceMonth),
    available: status === 'DISPONIBLE',
    areaM2: toNumber(row.area_total),
    pricePerM2: null,
    productionCost: null,
    owner: row.Propietario || null,
    imageUrl: images[0] || null,
    googleMapsLink: googleMaps,
    impactosDiarios: toInteger(impactos),
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function buildSupabasePayload(data: any, existing?: any) {
  const width = toNumber(data.widthM ?? existing?.Ancho)
  const height = toNumber(data.heightM ?? existing?.Alto)

  return {
    Codigo: data.code?.trim() || existing?.Codigo,
    nombre: data.title ?? existing?.nombre,
    Tipo: (data.type ?? existing?.Tipo ?? 'valla').toLowerCase(),
    Ancho: width ?? 0,
    Alto: height ?? 0,
    Ciudad: nullIfEmpty(data.city ?? existing?.Ciudad),
    Disponibilidad: mapStatusToSupabase(data.status ?? mapStatusFromSupabase(existing?.Disponibilidad)),
    'Precio por mes': toNumber(data.priceMonth ?? existing?.['Precio por mes']),
    'Impactos diarios': toInteger(data.impactosDiarios ?? existing?.['Impactos diarios']),
    foto_url: nullIfEmpty(data.googleMapsLink ?? existing?.foto_url),
    foto_url_2: data.images?.[1] ?? existing?.foto_url_2 ?? null,
    foto_url_3: data.images?.[2] ?? existing?.foto_url_3 ?? null,
    notas: data.notes ?? existing?.notas ?? null,
    Propietario: nullIfEmpty(data.owner ?? existing?.Propietario),
    dueno_casa_id: existing?.dueno_casa_id || '00000000-0000-0000-0000-000000000000', // UUID por defecto
  }
}
