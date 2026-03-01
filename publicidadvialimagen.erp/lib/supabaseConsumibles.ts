import { getSupabaseServer } from './supabaseServer'
import { validateCategoria } from './validateCategoria'

// Usar el cliente del servidor que bypassa RLS
const supabase = getSupabaseServer()

export interface ConsumibleSupabase {
  id: string
  codigo: string
  nombre: string
  categoria: string
  formato?: Array<{ formato: string; cantidad: number; unidad_medida: string }> | null
  responsable: string
  unidad_medida: string
  coste: number
  stock: number
  control_stock?: any
  cuenta_venta?: number | null
  cuenta_compra?: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

/* ============================================================
   🔁 Conversión de Supabase → Consumible interno
   ============================================================ */
export function supabaseToConsumible(record: any): ConsumibleSupabase {
  let unidadMedida = record.unidad_medida || ''
  if (unidadMedida === 'm²') unidadMedida = 'm2'

  // Parsear control_stock
  let controlStock: any = {}
  if (record.control_stock) {
    try {
      if (typeof record.control_stock === 'string') {
        const trimmed = record.control_stock.trim()
        if (trimmed.length > 0) controlStock = JSON.parse(trimmed)
      } else if (typeof record.control_stock === 'object') {
        controlStock = record.control_stock
      }
    } catch (e) {
      console.error('❌ Error parseando control_stock:', e)
      controlStock = {}
    }
  }

  // Parsear formato (JSONB) - puede ser objeto único o array
  let formato: Array<{ formato: string; cantidad: number; unidad_medida: string }> | null = null
  if (record.formato) {
    try {
      if (typeof record.formato === 'string') {
        const parsed = JSON.parse(record.formato)
        if (Array.isArray(parsed)) {
          formato = parsed
        } else if (parsed && typeof parsed === 'object' && parsed.formato) {
          // Compatibilidad con formato antiguo (objeto único)
          formato = [parsed]
        }
      } else if (Array.isArray(record.formato)) {
        formato = record.formato
      } else if (typeof record.formato === 'object' && record.formato.formato) {
        // Compatibilidad con formato antiguo (objeto único)
        formato = [record.formato]
      }
    } catch (e) {
      console.error('❌ Error parseando formato:', e)
      formato = null
    }
  }

  return {
    id: record.id,
    codigo: record.codigo || '',
    nombre: record.nombre || '',
    categoria: record.categoria || '',
    formato,
    responsable: record.responsable || '',
    unidad_medida: unidadMedida,
    coste: Number(record.coste) || 0,
    stock: Number(record.stock) || 0,
    control_stock: controlStock,
    cuenta_venta: record.cuenta_venta != null ? Number(record.cuenta_venta) : null,
    cuenta_compra: record.cuenta_compra != null ? Number(record.cuenta_compra) : null,
    fecha_creacion: record.fecha_creacion || new Date().toISOString(),
    fecha_actualizacion:
      record.fecha_actualizacion || new Date().toISOString()
  }
}

/* ============================================================
   🔁 Conversión de Consumible interno → Supabase
   ============================================================ */
export function consumibleToSupabase(consumible: Partial<ConsumibleSupabase>): Record<string, any> {
  const fields: Record<string, any> = {}

  if (consumible.codigo != null) fields.codigo = consumible.codigo
  if (consumible.nombre != null) fields.nombre = consumible.nombre

  // Categoría: usar exactamente la que viene, sin mapeo ni fallback
  if (consumible.categoria != null) {
    fields.categoria = consumible.categoria
  }

  // Formato como JSONB (array)
  if (consumible.formato !== undefined) {
    if (Array.isArray(consumible.formato) && consumible.formato.length > 0) {
      fields.formato = consumible.formato
    } else {
      fields.formato = null
    }
  }

  // Manejar responsable: convertir string vacío a null
  if (consumible.responsable != null) {
    fields.responsable = consumible.responsable.trim() || null
  }

  if (consumible.unidad_medida != null) {
    let unidad = consumible.unidad_medida || ''
    if (typeof unidad === 'string') {
      unidad = unidad.trim().replace(/[\\'"]/g, '')
    }
    fields.unidad_medida = unidad || null
  }

  if (consumible.coste != null) fields.coste = Number(consumible.coste) || 0
  if (consumible.stock != null) fields.stock = Number(consumible.stock) || 0

  // Control_stock siempre como objeto vacío si no se proporciona
  fields.control_stock = consumible.control_stock && typeof consumible.control_stock === 'object'
    ? consumible.control_stock
    : {}

  if (consumible.cuenta_venta !== undefined) {
    fields.cuenta_venta = consumible.cuenta_venta == null || consumible.cuenta_venta === '' ? null : Number(consumible.cuenta_venta)
  }
  if (consumible.cuenta_compra !== undefined) {
    fields.cuenta_compra = consumible.cuenta_compra == null || consumible.cuenta_compra === '' ? null : Number(consumible.cuenta_compra)
  }

  return fields
}

/* ============================================================
   📥 Obtener consumibles
   ============================================================ */
export async function getAllConsumibles() {
  try {
    const { data, error } = await supabase
      .from('consumibles')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (error) throw error

    return (data || []).map(supabaseToConsumible)
  } catch (error) {
    console.error('Error obteniendo consumibles:', error)
    throw error
  }
}

export async function getConsumiblesPage(
  page: number = 1,
  pageSize: number = 50,
  query?: string,
  categoria?: string
) {
  try {
    let queryBuilder = supabase
      .from('consumibles')
      .select('*', { count: 'exact' })

    if (categoria) queryBuilder = queryBuilder.eq('categoria', categoria)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    queryBuilder = queryBuilder
      .order('fecha_creacion', { ascending: false })
      .range(from, to)

    const { data, error, count } = await queryBuilder
    if (error) throw error

    return {
      data: (data || []).map(supabaseToConsumible),
      pagination: {
        page,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    console.error('Error paginando consumibles:', error)
    throw error
  }
}

export async function getConsumibleById(id: string) {
  try {
    const { data, error } = await supabase
      .from('consumibles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Consumible con ID ${id} no encontrado`)

    return supabaseToConsumible(data)
  } catch (error) {
    console.error('❌ Error obteniendo consumible por ID:', error)
    throw error
  }
}

export async function createConsumible(consumible: Partial<ConsumibleSupabase>) {
  try {
    // Validar categoría antes de convertir
    if (consumible.categoria !== undefined && consumible.categoria !== null) {
      await validateCategoria(consumible.categoria, 'Inventario', 'Consumibles')
    }
    
    const fields = consumibleToSupabase(consumible)
    console.log('📤 Campos a insertar:', JSON.stringify(fields, null, 2))

    const { data, error } = await supabase
      .from('consumibles')
      .insert([fields])
      .select()
      .single()

    if (error) {
      console.error('❌ Error de Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('✅ Data insertada:', data)
    return supabaseToConsumible(data)
  } catch (error) {
    console.error('❌ Error creando consumible:', error)
    throw error
  }
}

export async function updateConsumible(id: string, consumible: Partial<ConsumibleSupabase>) {
  try {
    // Validar categoría antes de convertir
    if (consumible.categoria !== undefined && consumible.categoria !== null) {
      await validateCategoria(consumible.categoria, 'Inventario', 'Consumibles')
    }
    
    const fields = consumibleToSupabase(consumible)

    const { data, error } = await supabase
      .from('consumibles')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return supabaseToConsumible(data)
  } catch (error) {
    console.error('❌ Error actualizando consumible:', error)
    throw error
  }
}

export async function deleteConsumible(id: string) {
  try {
    const { error } = await supabase
      .from('consumibles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error eliminando consumible:', error)
    throw error
  }
}
