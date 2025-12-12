import { getSupabaseAdmin } from '@/lib/supabaseServer'

// Tipo para un registro de soporte desde Supabase (nombres reales de columnas en snake_case)
export type SoporteRow = {
  id: string
  codigo?: string
  titulo?: string
  tipo_soporte?: string
  estado?: string
  ancho?: number
  alto?: number
  area_total?: number
  area_total_calculada?: number
  iluminacion?: boolean
  precio_mes?: number
  precio_m2_calculado?: number
  impactos_diarios?: number
  propietario?: string
  ciudad?: string
  pais?: string
  enlace_maps?: string // Campo correcto en Supabase
  latitud?: number
  longitud?: number
  imagen_principal?: any // JSONB array - preparado para futuras imágenes
  imagen_secundaria_1?: any // JSONB array
  imagen_secundaria_2?: any // JSONB array
  descripcion?: string
  direccion_notas?: string
  created_at?: string
  updated_at?: string
  resumen_ia?: string
  clasificacion_potencial_ia?: string
  solicitudes?: any // JSONB array
  airtable_id?: string
}

// Convertir JSONB de imágenes a formato compatible
function extractImageUrl(imageField: any): string | null {
  if (!imageField) return null
  if (Array.isArray(imageField) && imageField.length > 0) {
    // Si es array de objetos con url
    if (imageField[0]?.url) return imageField[0].url
    // Si es array de strings (URLs directas)
    if (typeof imageField[0] === 'string') return imageField[0]
  }
  // Si es string directo
  if (typeof imageField === 'string') return imageField
  return null
}

// Convertir registro de Supabase (snake_case) a formato compatible con Airtable (formato con espacios)
export function supabaseRowToAirtableFormat(row: SoporteRow): any {
  return {
    id: row.id,
    'Código': row.codigo || '',
    'Título': row.titulo || '',
    'Tipo de soporte': row.tipo_soporte || '',
    'Estado': row.estado || 'Disponible',
    'Ancho': row.ancho || null,
    'Alto': row.alto || null,
    'Área total': row.area_total || row.area_total_calculada || null,
    'Iluminación': row.iluminacion || false,
    'Precio por mes': row.precio_mes || null,
    'Impactos diarios': row.impactos_diarios || null,
    'Propietario': row.propietario || null,
    'Ciudad': row.ciudad || null,
    'País': row.pais || 'BO',
    'Enlace Google Maps': row.enlace_maps || null, // Mapear desde enlace_maps
    'Latitud': row.latitud || null,
    'Longitud': row.longitud || null,
    // Preparado para imágenes: convertir JSONB a formato Airtable
    'Imagen principal': extractImageUrl(row.imagen_principal) 
      ? [{ url: extractImageUrl(row.imagen_principal)! }] 
      : [],
    'Imagen secundaria 1': extractImageUrl(row.imagen_secundaria_1) 
      ? [{ url: extractImageUrl(row.imagen_secundaria_1)! }] 
      : [],
    'Imagen secundaria 2': extractImageUrl(row.imagen_secundaria_2) 
      ? [{ url: extractImageUrl(row.imagen_secundaria_2)! }] 
      : [],
    'Descripción': row.descripcion || null,
    'Dirección / Notas': row.direccion_notas || null,
    'Fecha de creación': row.created_at || new Date().toISOString(),
    'Última actualización': row.updated_at || new Date().toISOString(),
    'Resumen inteligente del soporte': row.resumen_ia || null,
    'Clasificación automática de potencial comercial': row.clasificacion_potencial_ia || null,
  }
}

// Obtener todos los soportes (para la web pública)
// Esta función usa getSupabaseAdmin() para bypass RLS ya que es una ruta pública
export async function getAllSoportes() {
  try {
    // Verificar que Supabase esté configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase no está configurado. Verifica las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
    }

    // Usar getSupabaseAdmin() para bypass RLS (ruta pública)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('soportes')
      .select('*')

    if (error) {
      console.error('Error obteniendo soportes de Supabase:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    if (!data) {
      console.warn('getAllSoportes: data es null o undefined')
      return {
        records: []
      }
    }

    return {
      records: data.map(row => ({
        id: row.id,
        fields: supabaseRowToAirtableFormat(row as SoporteRow)
      }))
    }
  } catch (error) {
    console.error('Error en getAllSoportes:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    throw error
  }
}

