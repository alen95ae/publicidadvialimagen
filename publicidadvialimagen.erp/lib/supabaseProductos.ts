import { getSupabaseServer } from './supabaseServer'

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
  
  // Normalizar categoría
  let categoriaRaw = record.categoria || 'Categoria general'
  if (typeof categoriaRaw === 'string') {
    categoriaRaw = categoriaRaw
      .replace(/["""''']+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  const valoresValidosExactos: Record<string, string> = {
    'categoria general': 'Categoria general',
    'impresion digital': 'Impresion Digital',
    'corte y grabado': 'Corte y Grabado',
    'displays': 'Displays'
  }
  
  const categoriaLower = categoriaRaw.toLowerCase()
  let categoriaFinal = valoresValidosExactos[categoriaLower]
  
  if (!categoriaFinal) {
    if (categoriaLower.includes('impresion')) {
      categoriaFinal = 'Impresion Digital'
    } else if (categoriaLower.includes('corte') && categoriaLower.includes('grabado')) {
      categoriaFinal = 'Corte y Grabado'
    } else if (categoriaLower.includes('display')) {
      categoriaFinal = 'Displays'
    } else {
      categoriaFinal = 'Categoria general'
    }
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
  
  // La columna proveedores no existe en Supabase
  let proveedores: any[] = []
  
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
  // Guardar imagen_portada en imagen_principal de Supabase (el campo correcto en la BD)
  // NO guardar en imagen_portada ya que esa columna no existe en Supabase
  if (producto.imagen_portada !== undefined) {
    fields.imagen_principal = producto.imagen_portada || null
  }
  
  if (producto.categoria !== undefined && producto.categoria !== null) {
    let categoriaValor = String(producto.categoria)
      .replace(/["""''']+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    const valoresValidosExactos: Record<string, string> = {
      'categoria general': 'Categoria general',
      'impresion digital': 'Impresion Digital',
      'corte y grabado': 'Corte y Grabado',
      'displays': 'Displays'
    }
    
    const categoriaLower = categoriaValor.toLowerCase()
    let categoriaFinal = valoresValidosExactos[categoriaLower]
    
    if (!categoriaFinal) {
      if (categoriaLower.includes('impresion')) {
        categoriaFinal = 'Impresion Digital'
      } else if (categoriaLower.includes('corte') && categoriaLower.includes('grabado')) {
        categoriaFinal = 'Corte y Grabado'
      } else if (categoriaLower.includes('display')) {
        categoriaFinal = 'Displays'
      } else {
        categoriaFinal = 'Categoria general'
      }
    }
    
    fields.categoria = categoriaFinal
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
    fields.coste = Number(producto.coste) || 0
  }
  if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
    fields.precio_venta = Number(producto.precio_venta) || 0
  }
  // La columna disponibilidad no existe en Supabase
  // No se guarda disponibilidad directamente
  
  if (producto.mostrar_en_web !== undefined && producto.mostrar_en_web !== null) {
    fields.mostrar_en_web = Boolean(producto.mostrar_en_web)
  }
  
  // Guardar variantes como JSONB
  if (producto.variantes !== undefined) {
    try {
      fields.variante = Array.isArray(producto.variantes) && producto.variantes.length > 0
        ? producto.variantes
        : []
    } catch (e) {
      fields.variante = []
    }
  }
  
  // Guardar receta como JSONB
  if (producto.receta !== undefined && producto.receta !== null) {
    try {
      fields.receta = Array.isArray(producto.receta) ? producto.receta : []
    } catch (e) {
      fields.receta = []
    }
  }
  
  // La columna proveedores no existe en Supabase
  // No se guarda proveedores directamente
  
  // Guardar calculadora de precios como JSONB
  if (producto.calculadora_de_precios !== undefined) {
    try {
      if (producto.calculadora_de_precios === null || producto.calculadora_de_precios === '') {
        fields.calculadora_precios = {}
      } else if (typeof producto.calculadora_de_precios === 'string') {
        // Si viene como string, intentar parsearlo
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
      console.error('Error serializando calculadora_precios:', e)
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
    const fields = productoToSupabase(producto)
    
    const { data, error } = await supabase
      .from('productos')
      .insert([fields])
      .select()
      .single()
    
    if (error) throw error
    
    return supabaseToProducto(data)
  } catch (error) {
    console.error('Error creando producto en Supabase:', error)
    throw error
  }
}

// Actualizar producto
export async function updateProducto(id: string, producto: Partial<ProductoSupabase>) {
  try {
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

