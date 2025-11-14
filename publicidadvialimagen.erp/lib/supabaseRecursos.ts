import { getSupabaseServer } from './supabaseServer'

// Usar el cliente del servidor que bypassa RLS
const supabase = getSupabaseServer()

export interface RecursoSupabase {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  imagen_portada?: string
  categoria: 'Insumos' | 'Mano de Obra'
  responsable: string
  unidad_medida: string
  cantidad: number
  coste: number
  precio_venta?: number
  variantes?: any[]
  control_stock?: any
  fecha_creacion: string
  fecha_actualizacion: string
}

// Convertir de Supabase a formato interno
export function supabaseToRecurso(record: any): RecursoSupabase {
  // Mapear unidades de Supabase al formato del frontend
  let unidadMedida = record.unidad_medida || ''
  if (unidadMedida === 'm²') {
    unidadMedida = 'm2'
  }
  
  // Parsear variantes desde JSONB
  let variantes: any[] = []
  if (record.variantes) {
    try {
      console.log('🔍 [BACKEND] Parseando variantes - tipo:', typeof record.variantes)
      console.log('🔍 [BACKEND] Parseando variantes - valor:', JSON.stringify(record.variantes, null, 2))
      
      if (typeof record.variantes === 'string') {
        // Si es un string, parsearlo
        const parsed = JSON.parse(record.variantes)
        console.log('🔍 [BACKEND] Variantes parseadas desde string:', parsed)
        
        if (Array.isArray(parsed)) {
          // Si el resultado es un array directo
          variantes = parsed
        } else if (parsed && typeof parsed === 'object') {
          // Si es un objeto, buscar la propiedad 'variantes'
          if (parsed.variantes && Array.isArray(parsed.variantes)) {
            variantes = parsed.variantes
          } else {
            variantes = []
          }
        }
      } else if (Array.isArray(record.variantes)) {
        // Si ya es un array, usarlo directamente
        console.log('✅ [BACKEND] Variantes ya es un array')
        variantes = record.variantes
      } else if (record.variantes && typeof record.variantes === 'object') {
        // Si es un objeto (JSONB parseado por Supabase)
        console.log('🔍 [BACKEND] Variantes es un objeto, buscando propiedad variantes')
        console.log('🔍 [BACKEND] Claves del objeto:', Object.keys(record.variantes))
        
        // Caso 1: El objeto tiene una propiedad 'variantes' que es un array
        if (record.variantes.variantes && Array.isArray(record.variantes.variantes)) {
          console.log('✅ [BACKEND] Encontrada propiedad variantes con', record.variantes.variantes.length, 'elementos')
          variantes = record.variantes.variantes
        } 
        // Caso 2: El objeto mismo podría ser un array (aunque typeof dice object)
        else if (Array.isArray(record.variantes)) {
          console.log('✅ [BACKEND] El objeto es realmente un array')
          variantes = record.variantes
        }
        // Caso 3: Verificar si tiene estructura de objeto con datosVariantes
        else if (record.variantes.datosVariantes) {
          console.log('⚠️ [BACKEND] Objeto tiene datosVariantes pero no variantes como array directo')
          // Si no hay variantes pero hay datosVariantes, intentar extraer las variantes de otra forma
          variantes = []
        } else {
          console.log('⚠️ [BACKEND] Objeto variantes no tiene estructura esperada')
          variantes = []
        }
      }
      
      console.log('✅ [BACKEND] Variantes finales parseadas:', variantes.length, 'variante(s)')
      if (variantes.length > 0) {
        console.log('📦 [BACKEND] Detalle de variantes:', JSON.stringify(variantes, null, 2))
      }
    } catch (e) {
      console.error('❌ [BACKEND] Error parseando variantes:', e)
      variantes = []
    }
  } else {
    console.log('⚠️ [BACKEND] No hay campo variantes en el registro')
  }
  
  // Parsear control de stock desde JSONB
  let controlStock: any = {}
  if (record.control_stock) {
    try {
      if (typeof record.control_stock === 'string') {
        const trimmed = record.control_stock.trim()
        if (trimmed.length > 0) {
          controlStock = JSON.parse(trimmed)
        }
      } else if (typeof record.control_stock === 'object') {
        controlStock = record.control_stock
      }
    } catch (e) {
      console.error(`❌ Error parseando Control de Stock:`, e)
      controlStock = {}
    }
  }
  
  // Mapear imagen_principal de Supabase a imagen_portada para el frontend
  // El script de migración guardó las imágenes en imagen_principal
  const imagenPortada = record.imagen_principal || record.imagen_portada || undefined
  
  return {
    id: record.id,
    codigo: record.codigo || '',
    nombre: record.nombre || '',
    descripcion: record.descripcion || '',
    imagen_portada: imagenPortada,
    categoria: record.categoria || 'Insumos',
    responsable: record.responsable || '',
    unidad_medida: unidadMedida,
    cantidad: Number(record.cantidad) || 0,
    coste: Number(record.coste) || 0,
    precio_venta: record.precio_venta ? Number(record.precio_venta) : undefined,
    variantes: variantes,
    control_stock: controlStock,
    fecha_creacion: record.fecha_creacion || new Date().toISOString(),
    fecha_actualizacion: record.fecha_actualizacion || new Date().toISOString()
  }
}

// Convertir de formato interno a Supabase
export function recursoToSupabase(recurso: Partial<RecursoSupabase>): Record<string, any> {
  const fields: Record<string, any> = {}
  
  if (recurso.codigo !== undefined && recurso.codigo !== null) {
    fields.codigo = recurso.codigo
  }
  if (recurso.nombre !== undefined && recurso.nombre !== null) {
    fields.nombre = recurso.nombre
  }
  if (recurso.descripcion !== undefined && recurso.descripcion !== null) {
    fields.descripcion = recurso.descripcion || ''
  }
  // Guardar imagen_portada en imagen_principal de Supabase (el campo que usa el script de migración)
  if (recurso.imagen_portada !== undefined) {
    // Guardar en ambos campos para compatibilidad
    fields.imagen_principal = recurso.imagen_portada || null
    fields.imagen_portada = recurso.imagen_portada || null
  }
  
  if (recurso.categoria !== undefined && recurso.categoria !== null) {
    const cat = recurso.categoria || ''
    fields.categoria = cat === 'Mano de Obra' ? 'Mano de Obra' : 'Insumos'
  }
  
  if (recurso.responsable !== undefined && recurso.responsable !== null) {
    fields.responsable = recurso.responsable || ''
  }
  
  if (recurso.unidad_medida !== undefined && recurso.unidad_medida !== null) {
    let unidad = recurso.unidad_medida || ''
    if (typeof unidad === 'string') {
      unidad = unidad.trim().replace(/[\\'"]/g, '')
    }
    fields.unidad_medida = unidad
  }
  
  if (recurso.cantidad !== undefined && recurso.cantidad !== null) {
    fields.cantidad = Number(recurso.cantidad) || 0
  }
  if (recurso.coste !== undefined && recurso.coste !== null) {
    fields.coste = Number(recurso.coste) || 0
  }
  if (recurso.precio_venta !== undefined && recurso.precio_venta !== null) {
    fields.precio_venta = Number(recurso.precio_venta) || 0
  }
  
  // Guardar variantes como JSONB
  if (recurso.variantes !== undefined && recurso.variantes !== null) {
    try {
      fields.variantes = Array.isArray(recurso.variantes) ? recurso.variantes : []
      console.log('📦 Variantes guardadas en Supabase:', fields.variantes.length, 'variante(s)')
    } catch (e) {
      console.error('Error serializando variantes:', e)
      fields.variantes = []
    }
  }
  
  // Guardar control de stock como JSONB
  if (recurso.control_stock !== undefined && recurso.control_stock !== null) {
    try {
      fields.control_stock = typeof recurso.control_stock === 'object'
        ? recurso.control_stock
        : {}
      console.log('📦 Control de Stock guardado en Supabase')
    } catch (e) {
      console.error('Error serializando Control de Stock:', e)
      fields.control_stock = {}
    }
  }
  
  return fields
}

// Obtener todos los recursos
export async function getAllRecursos() {
  try {
    const { data, error } = await supabase
      .from('recursos')
      .select('*')
      .order('fecha_creacion', { ascending: false })
    
    if (error) {
      console.error('❌ Error de Supabase al obtener recursos:', error)
      console.error('   - Code:', error.code)
      console.error('   - Message:', error.message)
      console.error('   - Details:', error.details)
      console.error('   - Hint:', error.hint)
      throw new Error(`Error obteniendo recursos: ${error.message}`)
    }
    
    return (data || []).map(supabaseToRecurso)
  } catch (error) {
    console.error('Error obteniendo recursos de Supabase:', error)
    throw error
  }
}

// Obtener recursos con paginación
export async function getRecursosPage(page: number = 1, pageSize: number = 50, query?: string, categoria?: string) {
  try {
    let queryBuilder = supabase
      .from('recursos')
      .select('*', { count: 'exact' })
    
    // Aplicar filtros
    if (query) {
      queryBuilder = queryBuilder.or(`codigo.ilike.%${query}%,nombre.ilike.%${query}%,categoria.ilike.%${query}%`)
    }
    
    if (categoria) {
      queryBuilder = queryBuilder.eq('categoria', categoria)
    }
    
    // Aplicar paginación
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    queryBuilder = queryBuilder
      .order('fecha_creacion', { ascending: false })
      .range(from, to)
    
    const { data, error, count } = await queryBuilder
    
    if (error) {
      console.error('❌ Error de Supabase al obtener página de recursos:', error)
      console.error('   - Code:', error.code)
      console.error('   - Message:', error.message)
      console.error('   - Details:', error.details)
      throw new Error(`Error obteniendo página de recursos: ${error.message}`)
    }
    
    const recursos = (data || []).map(supabaseToRecurso)
    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)
    
    return {
      data: recursos,
      pagination: {
        page,
        limit: pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error obteniendo página de recursos:', error)
    throw error
  }
}

// Obtener recurso por ID
export async function getRecursoById(id: string) {
  try {
    console.log('🔍 Obteniendo recurso por ID directo:', id)
    const { data, error } = await supabase
      .from('recursos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    if (!data) throw new Error(`Recurso con ID ${id} no encontrado`)
    
    console.log('✅ Recurso obtenido desde Supabase:', data)
    console.log('📦 Campo variantes RAW:', data.variantes)
    console.log('📦 Tipo de variantes:', typeof data.variantes)
    
    const recursoConvertido = supabaseToRecurso(data)
    console.log('🔄 Recurso convertido - variantes:', recursoConvertido.variantes)
    console.log('🔄 Recurso convertido - cantidad de variantes:', recursoConvertido.variantes?.length || 0)
    
    return recursoConvertido
  } catch (error) {
    console.error('❌ Error obteniendo recurso por ID:', error)
    throw error
  }
}

// Crear nuevo recurso
export async function createRecurso(recurso: Partial<RecursoSupabase>) {
  try {
    const fields = recursoToSupabase(recurso)
    
    const { data, error } = await supabase
      .from('recursos')
      .insert([fields])
      .select()
      .single()
    
    if (error) throw error
    
    return supabaseToRecurso(data)
  } catch (error) {
    console.error('Error creando recurso en Supabase:', error)
    throw error
  }
}

// Actualizar recurso
export async function updateRecurso(id: string, recurso: Partial<RecursoSupabase>) {
  try {
    console.log('🔄 updateRecurso llamado con:')
    console.log('   - ID:', id)
    console.log('   - Recurso recibido:', JSON.stringify(recurso, null, 2))
    
    const fields = recursoToSupabase(recurso)
    console.log('   - Campos que se enviarán a Supabase:', Object.keys(fields))
    
    const { data, error } = await supabase
      .from('recursos')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    console.log('✅ Recurso actualizado correctamente en Supabase')
    return supabaseToRecurso(data)
  } catch (error) {
    console.error('❌ Error actualizando recurso en Supabase:', error)
    if (error instanceof Error) {
      console.error('   - Mensaje de error:', error.message)
      console.error('   - Stack:', error.stack)
    }
    throw error
  }
}

// Eliminar recurso
export async function deleteRecurso(id: string) {
  try {
    const { error } = await supabase
      .from('recursos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error eliminando recurso en Supabase:', error)
    throw error
  }
}

