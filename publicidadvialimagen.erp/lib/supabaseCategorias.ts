import { getSupabaseServer } from './supabaseServer'

const supabase = getSupabaseServer()

export interface CategoriaConfig {
  id?: string
  nombre: string
  modulo: string
  seccion: string
  categorias: string[]
  fecha_creacion?: string
  fecha_actualizacion?: string
}

/**
 * Obtener configuración de categorías por módulo y sección
 */
export async function getCategoriaConfig(
  modulo: string,
  seccion: string
): Promise<CategoriaConfig | null> {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('modulo', modulo)
      .eq('seccion', seccion)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró la fila
        return null
      }
      throw error
    }

    return {
      id: data.id,
      nombre: data.nombre || '',
      modulo: data.modulo || '',
      seccion: data.seccion || '',
      categorias: Array.isArray(data.categorias) ? data.categorias : [],
      fecha_creacion: data.fecha_creacion,
      fecha_actualizacion: data.fecha_actualizacion
    }
  } catch (error) {
    console.error('❌ Error obteniendo configuración de categorías:', error)
    throw error
  }
}

/**
 * Actualizar solo el array de categorías
 */
export async function updateCategorias(
  modulo: string,
  seccion: string,
  categorias: string[]
): Promise<CategoriaConfig> {
  try {
    // Primero verificar si existe
    const existing = await getCategoriaConfig(modulo, seccion)

    if (!existing) {
      throw new Error(`No se encontró configuración para módulo "${modulo}" y sección "${seccion}"`)
    }

    const { data, error } = await supabase
      .from('categorias')
      .update({
        categorias: categorias,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('modulo', modulo)
      .eq('seccion', seccion)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      nombre: data.nombre || '',
      modulo: data.modulo || '',
      seccion: data.seccion || '',
      categorias: Array.isArray(data.categorias) ? data.categorias : [],
      fecha_creacion: data.fecha_creacion,
      fecha_actualizacion: data.fecha_actualizacion
    }
  } catch (error) {
    console.error('❌ Error actualizando categorías:', error)
    throw error
  }
}

