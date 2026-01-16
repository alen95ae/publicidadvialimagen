import { getSupabaseServer } from './supabaseServer'
import { validateCategoria } from './validateCategoria'

// Usar el cliente del servidor que bypassa RLS
const supabase = getSupabaseServer()

export interface RecursoSupabase {
  id: string
  codigo: string
  nombre: string
  imagen_portada?: string
  categoria: 'Insumos' | 'Mano de Obra' | 'Suministros'
  formato?: Array<{ formato: string; cantidad: number; unidad_medida: string }> | null
  responsable: string
  unidad_medida: string
  coste: number
  precio_venta?: number
  variantes?: any[]
  control_stock?: any
  proveedores?: any[]
  fecha_creacion: string
  fecha_actualizacion: string
}

/* ============================================================
   🔥 PARSER UNIVERSAL DE VARIANTES (VERSIÓN ESTABLE)
   Garantiza que siempre se devuelva:

   variantes: Array<{ nombre: string; valores: string[]; posibilidades?: string[] }>
   ============================================================ */
function normalizeVariantes(
  raw: any
): { nombre: string; valores: string[]; posibilidades?: string[]; modo?: string }[] {
  try {
    if (!raw) return []

    // 1. Si viene como string → intentar parsearlo
    if (typeof raw === 'string') {
      try {
        const trimmed = raw.trim()
        if (trimmed.length === 0) return []
        raw = JSON.parse(trimmed)
      } catch (e) {
        console.warn('⚠️ Variantes inválidas en string → se ignoran:', e)
        return []
      }
    }

    // 2. Si viene como array
    if (Array.isArray(raw)) {
      return raw
        .filter(v => v && typeof v === 'object' && v.nombre)
        .map(v => {
          // Aceptar tanto 'valores' como 'posibilidades' para compatibilidad
          const valores = Array.isArray(v.valores) 
            ? v.valores.map(x => String(x).trim()).filter(x => x.length > 0)
            : Array.isArray(v.posibilidades)
            ? v.posibilidades.map(x => String(x).trim()).filter(x => x.length > 0)
            : []
          
          return {
            nombre: String(v.nombre).trim(),
            valores,
            posibilidades: valores, // Mantener compatibilidad con frontend
            modo: v.modo || 'lista' // Mantener modo si existe
          }
        })
        .filter(v => v.valores.length > 0)
    }

    // 3. Si viene como objeto con propiedad "variantes"
    if (raw && typeof raw === 'object' && Array.isArray(raw.variantes)) {
      return raw.variantes
        .filter(v => v && typeof v === 'object' && v.nombre)
        .map(v => {
          const valores = Array.isArray(v.valores) 
            ? v.valores.map(x => String(x).trim()).filter(x => x.length > 0)
            : Array.isArray(v.posibilidades)
            ? v.posibilidades.map(x => String(x).trim()).filter(x => x.length > 0)
            : []
          
          return {
            nombre: String(v.nombre).trim(),
            valores,
            posibilidades: valores, // Mantener compatibilidad con frontend
            modo: v.modo || 'lista'
          }
        })
        .filter(v => v.valores.length > 0)
    }

    // 4. Formato desconocido
    console.warn('⚠️ Formato de variantes no reconocido:', typeof raw, raw)
    return []
  } catch (err) {
    console.error('❌ Error normalizando variantes:', err, 'Raw:', raw)
    return []
  }
}

/* ============================================================
   🔁 Conversión de Supabase → Recurso interno
   ============================================================ */
export function supabaseToRecurso(record: any): RecursoSupabase {
  let unidadMedida = record.unidad_medida || ''
  if (unidadMedida === 'm²') unidadMedida = 'm2'

  // 🔥 Nuevo parser sólido
  console.log('🔍 [supabaseToRecurso] Raw variantes from DB:', {
    type: typeof record.variantes,
    isArray: Array.isArray(record.variantes),
    value: record.variantes
  })
  const variantes = normalizeVariantes(record.variantes)
  console.log('✅ [supabaseToRecurso] Normalized variantes:', variantes)

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

  // Parsear proveedores
  let proveedores: any[] = []
  if (record.proveedores) {
    try {
      if (typeof record.proveedores === 'string') {
        proveedores = JSON.parse(record.proveedores)
      } else {
        proveedores = record.proveedores
      }
    } catch {
      proveedores = []
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

  const imagenPortada =
    record.imagen_principal || record.imagen_portada || undefined

  return {
    id: record.id,
    codigo: record.codigo || '',
    nombre: record.nombre || '',
    imagen_portada: imagenPortada,
    // Preservar categoría exactamente como está en la BD (sin fallbacks)
    // La validación se hace en el backend API antes de guardar
    categoria: record.categoria || '',
    formato,
    responsable: record.responsable || '',
    unidad_medida: unidadMedida,
    coste: Number(record.coste) || 0,
    precio_venta: record.precio_venta
      ? Number(record.precio_venta)
      : undefined,
    variantes,
    control_stock: controlStock,
    proveedores,
    fecha_creacion: record.fecha_creacion || new Date().toISOString(),
    fecha_actualizacion:
      record.fecha_actualizacion || new Date().toISOString()
  }
}

/* ============================================================
   🔁 Conversión de Recurso interno → Supabase
   ============================================================ */
export function recursoToSupabase(recurso: Partial<RecursoSupabase>): Record<string, any> {
  const fields: Record<string, any> = {}

  if (recurso.codigo != null) fields.codigo = recurso.codigo
  if (recurso.nombre != null) fields.nombre = recurso.nombre

  if (recurso.imagen_portada !== undefined) {
    fields.imagen_principal = recurso.imagen_portada || null
  }

  // Preservar categoría exactamente como viene (sin mapeos ni fallbacks)
  // La validación se hace en el backend API antes de guardar usando validateCategoria()
  if (recurso.categoria != null) {
    const categoriaValor = String(recurso.categoria).trim()
    // Solo asignar si no está vacío (el backend validará contra la tabla categorias)
    if (categoriaValor) {
      fields.categoria = categoriaValor
    }
  }

  // Formato como JSONB (array)
  if (recurso.formato !== undefined) {
    if (Array.isArray(recurso.formato) && recurso.formato.length > 0) {
      fields.formato = recurso.formato
    } else {
      fields.formato = null
    }
  }

  if (recurso.responsable != null) fields.responsable = recurso.responsable

  if (recurso.unidad_medida != null) {
    let unidad = recurso.unidad_medida || ''
    if (typeof unidad === 'string') {
      unidad = unidad.trim().replace(/[\\'"]/g, '')
    }
    fields.unidad_medida = unidad
  }

  if (recurso.coste != null) fields.coste = Number(recurso.coste) || 0
  if (recurso.precio_venta != null)
    fields.precio_venta = Number(recurso.precio_venta) || 0

  // 🔥 Guardar variantes como JSONB limpio
  if (recurso.variantes != null) {
    try {
      fields.variantes = Array.isArray(recurso.variantes)
        ? recurso.variantes
        : []
    } catch {
      fields.variantes = []
    }
  }

  if (recurso.control_stock != null) {
    fields.control_stock =
      typeof recurso.control_stock === 'object'
        ? recurso.control_stock
        : {}
  }

  if (recurso.proveedores != null) {
    fields.proveedores = Array.isArray(recurso.proveedores)
      ? recurso.proveedores
      : []
  }

  return fields
}

/* ============================================================
   📥 Obtener recursos
   ============================================================ */
export async function getAllRecursos() {
  try {
    const { data, error } = await supabase
      .from('recursos')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (error) throw error

    return (data || []).map(supabaseToRecurso)
  } catch (error) {
    console.error('Error obteniendo recursos:', error)
    throw error
  }
}

export async function getRecursosPage(
  page: number = 1,
  pageSize: number = 50,
  query?: string,
  categoria?: string
) {
  try {
    let queryBuilder = supabase
      .from('recursos')
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
      data: (data || []).map(supabaseToRecurso),
      pagination: {
        page,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    console.error('Error paginando recursos:', error)
    throw error
  }
}

export async function getRecursoById(id: string) {
  try {
    const { data, error } = await supabase
      .from('recursos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Recurso con ID ${id} no encontrado`)

    return supabaseToRecurso(data)
  } catch (error) {
    console.error('❌ Error obteniendo recurso por ID:', error)
    throw error
  }
}

export async function createRecurso(recurso: Partial<RecursoSupabase>) {
  try {
    // Validar categoría antes de convertir
    if (recurso.categoria !== undefined && recurso.categoria !== null) {
      await validateCategoria(recurso.categoria, 'Inventario', 'Recursos')
    }
    
    const fields = recursoToSupabase(recurso)

    const { data, error } = await supabase
      .from('recursos')
      .insert([fields])
      .select()
      .single()

    if (error) throw error

    return supabaseToRecurso(data)
  } catch (error) {
    console.error('❌ Error creando recurso:', error)
    throw error
  }
}

export async function updateRecurso(id: string, recurso: Partial<RecursoSupabase>) {
  try {
    // Validar categoría antes de convertir
    if (recurso.categoria !== undefined && recurso.categoria !== null) {
      await validateCategoria(recurso.categoria, 'Inventario', 'Recursos')
    }
    
    const fields = recursoToSupabase(recurso)

    const { data, error } = await supabase
      .from('recursos')
      .update(fields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return supabaseToRecurso(data)
  } catch (error) {
    console.error('❌ Error actualizando recurso:', error)
    throw error
  }
}

export async function deleteRecurso(id: string) {
  try {
    const { error } = await supabase
      .from('recursos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error eliminando recurso:', error)
    throw error
  }
}
