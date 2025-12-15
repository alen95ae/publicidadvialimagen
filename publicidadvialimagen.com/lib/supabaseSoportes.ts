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
    console.log('🔍 [getAllSoportes] Iniciando...')
    
    // Verificar que Supabase esté configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const missingVars = []
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
      throw new Error(`Supabase no está configurado. Variables faltantes: ${missingVars.join(', ')}`)
    }

    console.log('✅ [getAllSoportes] Variables de entorno OK')
    
    // Usar getSupabaseAdmin() para bypass RLS (ruta pública)
    let supabase
    try {
      supabase = getSupabaseAdmin()
      console.log('✅ [getAllSoportes] Cliente Supabase Admin creado')
    } catch (adminError) {
      console.error('❌ [getAllSoportes] Error creando cliente Supabase Admin:', adminError)
      throw new Error(`Error creando cliente Supabase: ${adminError instanceof Error ? adminError.message : String(adminError)}`)
    }

    console.log('🔍 [getAllSoportes] Ejecutando query...')
    const { data, error } = await supabase
      .from('soportes')
      .select('*')

    if (error) {
      console.error('❌ [getAllSoportes] Error obteniendo soportes de Supabase:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }

    console.log(`✅ [getAllSoportes] Query completado. Data recibida: ${data ? data.length : 0} registros`)

    if (!data) {
      console.warn('⚠️ [getAllSoportes] data es null o undefined')
      return {
        records: []
      }
    }
    
    // Validar que data sea un array
    if (!Array.isArray(data)) {
      console.warn(`⚠️ [getAllSoportes] data no es un array (tipo: ${typeof data}), retornando array vacío`)
      return {
        records: []
      }
    }
    
    console.log(`🔄 [getAllSoportes] Procesando ${data.length} registros...`)
    
    // Filtrar y mapear registros de forma segura
    const records = data
      .filter(row => {
        if (!row || !row.id) {
          console.warn('⚠️ [getAllSoportes] Registro inválido filtrado:', row)
          return false
        }
        return true
      })
      .map(row => {
        try {
          return {
            id: row.id,
            fields: supabaseRowToAirtableFormat(row as SoporteRow)
          }
        } catch (err) {
          console.error(`❌ [getAllSoportes] Error procesando registro ${row?.id}:`, err)
          return null
        }
      })
      .filter(record => record !== null) // Filtrar registros que fallaron
    
    console.log(`✅ [getAllSoportes] ${records.length} registros procesados correctamente`)
    
    return {
      records
    }
  } catch (error) {
    console.error('❌ [getAllSoportes] Error general:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    throw error
  }
}

