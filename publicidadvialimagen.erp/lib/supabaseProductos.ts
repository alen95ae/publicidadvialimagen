import { getSupabaseServer } from './supabaseServer'
import { normalizeText } from './utils'
import { validateCategoria } from './validateCategoria'

// Usar el cliente del servidor que bypassa RLS
const supabase = getSupabaseServer()

export interface ProductoSupabase {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  imagen_portada?: string
  categoria: string
  responsable: string
  unidad_medida: string
  coste: number
  precio_venta: number
  cantidad: number
  disponibilidad: string
  mostrar_en_web?: boolean
  variantes?: any[]
  receta?: any[]
  proveedores?: any[]
  calculadora_de_precios?: any
  fecha_creacion: string
  fecha_actualizacion: string
}

// Convertir de Supabase a formato interno
export function supabaseToProducto(record: any): ProductoSupabase {
  // Mapear unidades de Supabase al formato del frontend
  let unidadMedida = record.unidad_medida || ''
  if (unidadMedida === 'm²') {
    unidadMedida = 'm2'
  }
  
  // Preservar categoría exactamente como está en la BD (sin mapeos ni normalizaciones)
  // La validación se hace en el backend API antes de guardar
  let categoriaFinal = record.categoria
  if (typeof categoriaFinal === 'string') {
    categoriaFinal = categoriaFinal.trim()
  } else if (!categoriaFinal) {
    // Si no hay categoría, usar string vacío (será validado en el backend)
    categoriaFinal = ''
  }
  
  // Parsear JSONB fields
  let variantes: any[] = []
  if (record.variante) {
    try {
      if (typeof record.variante === 'string') {
        variantes = JSON.parse(record.variante)
      } else {
        variantes = record.variante
      }
    } catch (e) {
      console.error('Error parseando variante:', e)
      variantes = []
    }
  }
  
  let receta: any[] = []
  if (record.receta) {
    try {
      if (typeof record.receta === 'string') {
        receta = JSON.parse(record.receta)
      } else {
        receta = record.receta
      }
    } catch (e) {
      console.error('Error parseando receta:', e)
      receta = []
    }
  }
  
  // Parsear proveedores desde JSONB
  let proveedores: any[] = []
  if (record.proveedores) {
    try {
      if (typeof record.proveedores === 'string') {
        proveedores = JSON.parse(record.proveedores)
      } else {
        proveedores = record.proveedores
      }
    } catch (e) {
      console.error('Error parseando proveedores:', e)
      proveedores = []
    }
  }
  
  let calculadoraDePrecios: any = null
  if (record.calculadora_precios) {
    try {
      if (typeof record.calculadora_precios === 'string') {
        calculadoraDePrecios = JSON.parse(record.calculadora_precios)
      } else {
        calculadoraDePrecios = record.calculadora_precios
      }
    } catch (e) {
      console.error('Error parseando calculadora_precios:', e)
      calculadoraDePrecios = null
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
    categoria: categoriaFinal,
    responsable: record.responsable || '',
    unidad_medida: unidadMedida,
    coste: Number(record.coste) || 0,
    precio_venta: Number(record.precio_venta) || 0,
    cantidad: 0, // La cantidad no se guarda en Supabase, se calcula desde receta
    disponibilidad: 'Disponible', // Valor por defecto, no se guarda en Supabase
    mostrar_en_web: record.mostrar_en_web || false,
    variantes: variantes,
    receta: receta,
    proveedores: proveedores,
    calculadora_de_precios: calculadoraDePrecios,
    fecha_creacion: record.fecha_creacion || new Date().toISOString(),
    fecha_actualizacion: record.fecha_actualizacion || new Date().toISOString()
  }
}

// Convertir de formato interno a Supabase
export function productoToSupabase(producto: Partial<ProductoSupabase>): Record<string, any> {
  const fields: Record<string, any> = {}
  
  if (producto.codigo !== undefined && producto.codigo !== null) {
    fields.codigo = String(producto.codigo).trim()
  }
  if (producto.nombre !== undefined && producto.nombre !== null) {
    fields.nombre = String(producto.nombre).trim()
  }
  if (producto.descripcion !== undefined && producto.descripcion !== null) {
    fields.descripcion = String(producto.descripcion).trim() || ''
  }
  // Guardar imagen_principal (esquema real de Supabase)
  if (producto.imagen_principal !== undefined) {
    fields.imagen_principal = producto.imagen_principal || null
  } else if (producto.imagen_portada !== undefined) {
    // Compatibilidad con formato antiguo
    fields.imagen_principal = producto.imagen_portada || null
  }
  
  // Preservar categoría exactamente como viene del frontend (sin mapeos ni normalizaciones)
  // La validación se hace en el backend API antes de guardar usando validateCategoria()
  if (producto.categoria !== undefined && producto.categoria !== null) {
    const categoriaValor = String(producto.categoria).trim()
    // Solo asignar si no está vacío (el backend validará contra la tabla categorias)
    if (categoriaValor) {
      fields.categoria = categoriaValor
    }
  }
  
  if (producto.responsable !== undefined && producto.responsable !== null) {
    fields.responsable = producto.responsable || ''
  }
  
  if (producto.unidad_medida !== undefined && producto.unidad_medida !== null) {
    let unidad = producto.unidad_medida || ''
    if (typeof unidad === 'string') {
      unidad = unidad
        .replace(/["""'''\\]+/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    // Aplicar mapeo m2 → m² para Supabase (aunque en la BD guardamos m2)
    // Mantenemos m2 en la BD para consistencia
    fields.unidad_medida = unidad
  }
  
  // La columna cantidad no existe en Supabase, se calcula desde receta
  // No se guarda cantidad directamente
  if (producto.coste !== undefined && producto.coste !== null) {
    const costeNum = Number(producto.coste)
    // Validar que sea un número válido (no NaN, no Infinity)
    if (isNaN(costeNum) || !isFinite(costeNum) || costeNum < 0) {
      fields.coste = 0
    } else {
      fields.coste = Math.round(costeNum * 100) / 100 // Redondear a 2 decimales
    }
  }
  if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
    const precioNum = Number(producto.precio_venta)
    // Validar que sea un número válido (no NaN, no Infinity)
    if (isNaN(precioNum) || !isFinite(precioNum) || precioNum < 0) {
      fields.precio_venta = 0
    } else {
      fields.precio_venta = Math.round(precioNum * 100) / 100 // Redondear a 2 decimales
    }
  }
  // La columna disponibilidad no existe en Supabase
  // No se guarda disponibilidad directamente
  
  if (producto.mostrar_en_web !== undefined && producto.mostrar_en_web !== null) {
    fields.mostrar_en_web = Boolean(producto.mostrar_en_web)
  }
  
  // Guardar variante (singular, según esquema real)
  // IMPORTANTE: Solo actualizar variante si se envía explícitamente
  // Si es undefined, no incluir en fields para no sobrescribir el valor existente
  if (producto.variante !== undefined) {
    try {
      if (producto.variante === null) {
        // Si se envía null explícitamente, guardar como array vacío
        fields.variante = []
      } else if (Array.isArray(producto.variante)) {
        // Si es un array, guardarlo (incluso si está vacío, porque se envió explícitamente)
        fields.variante = producto.variante
      } else {
        // Formato inválido, usar array vacío
        fields.variante = []
      }
    } catch (e) {
      console.error('Error procesando variante:', e)
      fields.variante = []
    }
  } else if (producto.variantes !== undefined) {
    // Compatibilidad con formato antiguo (plural)
    try {
      fields.variante = Array.isArray(producto.variantes) && producto.variantes.length > 0
        ? producto.variantes
        : []
    } catch (e) {
      console.error('Error procesando variantes (plural):', e)
      fields.variante = []
    }
  }
  // Si producto.variante es undefined, NO incluir en fields para preservar el valor existente en la BD
  
  // Guardar receta como JSONB (debe ser ARRAY, no objeto)
  if (producto.receta !== undefined && producto.receta !== null) {
    try {
      if (Array.isArray(producto.receta)) {
        // Formato correcto: array
        fields.receta = producto.receta.length > 0 ? producto.receta : []
      } else if (typeof producto.receta === 'object' && producto.receta.items && Array.isArray(producto.receta.items)) {
        // Formato antiguo: objeto con items (convertir a array)
        console.warn('⚠️ Receta en formato antiguo (objeto), convirtiendo a array')
        fields.receta = producto.receta.items.length > 0 ? producto.receta.items : []
      } else {
        // Formato inválido, usar array vacío
        console.warn('⚠️ Receta en formato inválido, usando array vacío')
        fields.receta = []
      }
    } catch (e) {
      console.error('Error serializando receta:', e)
      fields.receta = []
    }
  }
  
  // Guardar proveedores como JSONB
  if (producto.proveedores !== undefined && producto.proveedores !== null) {
    try {
      if (producto.proveedores === null) {
        fields.proveedores = []
      } else if (Array.isArray(producto.proveedores)) {
        fields.proveedores = producto.proveedores.length > 0 ? producto.proveedores : []
      } else {
        fields.proveedores = []
      }
    } catch (e) {
      console.error('Error serializando proveedores:', e)
      fields.proveedores = []
    }
  }
  
  // NO guardar calculadora_costes (no existe en el esquema)
  // La calculadora de costes se guarda en "receta" según el esquema real

  // FIX 7: Guardar calculadora de precios como JSONB
  // Asegurar que calculadoraCostes se preserve correctamente
  if (producto.calculadora_precios !== undefined) {
    try {
      if (producto.calculadora_precios === null || producto.calculadora_precios === '') {
        fields.calculadora_precios = {}
      } else if (typeof producto.calculadora_precios === 'string') {
        // Si viene como string, intentar parsearlo
        try {
          fields.calculadora_precios = JSON.parse(producto.calculadora_precios)
        } catch {
          fields.calculadora_precios = {}
        }
      } else if (typeof producto.calculadora_precios === 'object') {
        // Limpiar undefined del objeto antes de guardar, pero preservar calculadoraCostes
        const calculadoraLimpia = JSON.parse(JSON.stringify(producto.calculadora_precios, (key, value) => {
          // Remover undefined (Supabase no acepta undefined en JSONB)
          // Convertir undefined → null, pero NO borrar claves
          if (value === undefined) return null
          // Preservar calculadoraCostes incluso si está vacío
          if (key === 'calculadoraCostes' && value === null) return { costRows: [], totalCost: 0 }
          return value
        }))
        
        // Asegurar que calculadoraCostes existe si estaba en el objeto original
        if (producto.calculadora_precios.calculadoraCostes !== undefined) {
          if (!calculadoraLimpia.calculadoraCostes) {
            calculadoraLimpia.calculadoraCostes = producto.calculadora_precios.calculadoraCostes || { costRows: [], totalCost: 0 }
          }
        }
        
        fields.calculadora_precios = calculadoraLimpia
      } else {
        fields.calculadora_precios = {}
      }
    } catch (e) {
      console.error('Error serializando calculadora_precios:', e)
      fields.calculadora_precios = {}
    }
  }

  // Mantener compatibilidad con calculadora_de_precios (formato antiguo)
  if (producto.calculadora_de_precios !== undefined && producto.calculadora_precios === undefined) {
    try {
      if (producto.calculadora_de_precios === null || producto.calculadora_de_precios === '') {
        fields.calculadora_precios = {}
      } else if (typeof producto.calculadora_de_precios === 'string') {
        try {
          fields.calculadora_precios = JSON.parse(producto.calculadora_de_precios)
        } catch {
          fields.calculadora_precios = {}
        }
      } else if (typeof producto.calculadora_de_precios === 'object') {
        fields.calculadora_precios = producto.calculadora_de_precios
      } else {
        fields.calculadora_precios = {}
      }
    } catch (e) {
      console.error('Error serializando calculadora_de_precios:', e)
      fields.calculadora_precios = {}
    }
  }
  
  return fields
}

// Obtener todos los productos
export async function getAllProductos() {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('fecha_creacion', { ascending: false })
    
    if (error) {
      console.error('❌ Error de Supabase al obtener productos:', error)
      console.error('   - Code:', error.code)
      console.error('   - Message:', error.message)
      console.error('   - Details:', error.details)
      console.error('   - Hint:', error.hint)
      throw new Error(`Error obteniendo productos: ${error.message}`)
    }
    
    return (data || []).map(supabaseToProducto)
  } catch (error) {
    console.error('Error obteniendo productos de Supabase:', error)
    throw error
  }
}

// Obtener productos con paginación
export async function getProductosPage(page: number = 1, pageSize: number = 25, query?: string, categoria?: string) {
  try {
    let queryBuilder = supabase
      .from('productos')
      .select('*', { count: 'exact' })
    
    // TEXT SEARCH - Deshabilitado en backend para hacer búsqueda flexible en frontend
    // La búsqueda se hará completamente en el frontend con normalización de acentos, puntos, etc.
    // if (query) {
    //   const normalizedQuery = normalizeText(query)
    //   queryBuilder = queryBuilder.or(`codigo.ilike.%${normalizedQuery}%,nombre.ilike.%${normalizedQuery}%,categoria.ilike.%${normalizedQuery}%`)
    // }
    
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
      console.error('❌ Error de Supabase al obtener página de productos:', error)
      console.error('   - Code:', error.code)
      console.error('   - Message:', error.message)
      console.error('   - Details:', error.details)
      throw new Error(`Error obteniendo página de productos: ${error.message}`)
    }
    
    const productos = (data || []).map(supabaseToProducto)
    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)
    
    return {
      data: productos,
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
    console.error('Error obteniendo página de productos:', error)
    throw error
  }
}

// Obtener producto por ID
export async function getProductoById(id: string) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    if (!data) throw new Error(`Producto con ID ${id} no encontrado`)
    
    return supabaseToProducto(data)
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error)
    throw error
  }
}

// Crear nuevo producto
export async function createProducto(producto: Partial<ProductoSupabase>) {
  try {
    // Validar categoría antes de convertir
    if (producto.categoria !== undefined && producto.categoria !== null) {
      await validateCategoria(producto.categoria, 'Inventario', 'Productos')
    }
    
    const fields = productoToSupabase(producto)
    
    // Log de campos que se van a insertar (para debugging)
    console.log('📤 Campos a insertar en Supabase:', Object.keys(fields))
    console.log('📤 Campos completos:', JSON.stringify(fields, null, 2))
    
    const { data, error } = await supabase
      .from('productos')
      .insert([fields])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error de Supabase al insertar:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }
    
    return supabaseToProducto(data)
  } catch (error) {
    console.error('❌ Error creando producto en Supabase:', error)
    if (error && typeof error === 'object' && 'message' in error) {
      console.error('❌ Detalles completos del error:', JSON.stringify(error, null, 2))
    }
    throw error
  }
}

// Actualizar producto
export async function updateProducto(id: string, producto: Partial<ProductoSupabase>) {
  try {
    // Validar categoría antes de convertir
    if (producto.categoria !== undefined && producto.categoria !== null) {
      await validateCategoria(producto.categoria, 'Inventario', 'Productos')
    }
    
    console.log('🔄 updateProducto llamado con:')
    console.log('   - ID:', id)
    console.log('   - Producto recibido:', JSON.stringify(producto, null, 2))
    
    const fields = productoToSupabase(producto)
    console.log('   - Campos que se enviarán a Supabase:', Object.keys(fields))
    
    const { data, error } = await supabase
      .from('productos')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error de Supabase al actualizar producto:', error)
      console.error('   - Code:', error.code)
      console.error('   - Message:', error.message)
      console.error('   - Details:', error.details)
      console.error('   - Hint:', error.hint)
      console.error('   - Campos enviados:', Object.keys(fields))
      console.error('   - Campo calculadora_precios:', fields.calculadora_precios ? 'presente' : 'ausente')
      if (fields.calculadora_precios) {
        console.error('   - Tipo calculadora_precios:', typeof fields.calculadora_precios)
        console.error('   - Valor calculadora_precios (preview):', JSON.stringify(fields.calculadora_precios).substring(0, 200))
      }
      throw new Error(`Error actualizando producto en Supabase: ${error.message}`)
    }
    
    console.log('✅ Producto actualizado correctamente en Supabase')
    return supabaseToProducto(data)
  } catch (error) {
    console.error('❌ Error actualizando producto en Supabase:', error)
    if (error instanceof Error) {
      console.error('   - Mensaje de error:', error.message)
      console.error('   - Stack:', error.stack)
    }
    throw error
  }
}

// Eliminar producto
export async function deleteProducto(id: string) {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  } catch (error) {
    console.error('Error eliminando producto en Supabase:', error)
    throw error
  }
}

