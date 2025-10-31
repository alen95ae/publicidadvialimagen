import { airtableList, airtableCreate, airtableUpdate, airtableDelete, getAllRecords, getRecordsPage } from './airtable-rest'

const TABLE_NAME = 'Productos'

export interface ProductoAirtable {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  imagen_portada?: string // URL o attachment
  categoria: string
  responsable: string
  unidad_medida: string
  coste: number
  precio_venta: number
  cantidad: number
  disponibilidad: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ProductoAirtableFields {
  'Código': string
  'Nombre': string
  'Descripción'?: string
  'Imagen de Portada'?: any // Attachment type
  'Categoría': string
  'Responsable': string
  'Unidad de Medida': string
  'Coste': number
  'Precio Venta': number
  'Stock': number
  'Disponibilidad': string
  'Fecha Creación': string
  'Fecha Actualización': string
}

// Convertir de Airtable a formato interno
export function airtableToProducto(record: any): ProductoAirtable {
  const fields = record.fields
  
  // Mapear unidades de Airtable al formato del frontend
  // Si Airtable tiene "m²" (superíndice), convertir a "m2" para el Select
  let unidadMedida = fields['Unidad de Medida'] || ''
  
  // LIMPIAR TODAS LAS COMILLAS QUE PUEDAN VENIR DE AIRTABLE
  if (typeof unidadMedida === 'string') {
    unidadMedida = unidadMedida
      .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
      .replace(/\s+/g, ' ')       // Normalizar espacios
      .trim()
  }
  
  if (unidadMedida === 'm²') {
    unidadMedida = 'm2'
  } else if (unidadMedida === 'unidad') {
    unidadMedida = 'unidad'
  }
  
  // Manejar imagen de portada (attachment)
  let imagenPortada: string | undefined
  if (fields['Imagen de Portada'] && Array.isArray(fields['Imagen de Portada']) && fields['Imagen de Portada'].length > 0) {
    imagenPortada = fields['Imagen de Portada'][0].url || undefined
  }
  
  let categoriaRaw = fields['Categoría'] || 'Categoria general'
  
  // LIMPIAR TODAS LAS COMILLAS QUE PUEDAN VENIR DE AIRTABLE
  if (typeof categoriaRaw === 'string') {
    categoriaRaw = categoriaRaw
      .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
      .replace(/\s+/g, ' ')       // Normalizar espacios
      .trim()
  }
  
  // Normalizar a los valores correctos
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
  
  return {
    id: record.id,
    codigo: fields['Código'] || '',
    nombre: fields['Nombre'] || '',
    descripcion: fields['Descripción'] || '',
    imagen_portada: imagenPortada,
    categoria: categoriaFinal,
    responsable: fields['Responsable'] || '',
    unidad_medida: unidadMedida,
    coste: fields['Coste'] || 0,
    precio_venta: fields['Precio Venta'] || 0,
    cantidad: fields['Stock'] || 0,
    disponibilidad: fields['Disponibilidad'] || 'Disponible',
    fecha_creacion: fields['Fecha Creación'] || new Date().toISOString(),
    fecha_actualizacion: fields['Fecha Actualización'] || new Date().toISOString()
  }
}

// Convertir de formato interno a Airtable
export function productoToAirtable(producto: Partial<ProductoAirtable>): Partial<ProductoAirtableFields> {
  // Aplicar mapeo de unidades (m2 → m²)
  let unidadMedida = producto.unidad_medida || ''
  if (unidadMedida === 'm2') {
    console.log('🔄 [CREATE] Convirtiendo unidad:', 'm2', '→', 'm²')
    unidadMedida = 'm²'
  }
  
  const fields: Partial<ProductoAirtableFields> = {
    'Código': producto.codigo || '',
    'Nombre': producto.nombre || '',
    'Descripción': producto.descripcion || '',
    'Categoría': producto.categoria || 'Categoria general',
    'Responsable': producto.responsable || '',
    'Unidad de Medida': unidadMedida,
    'Stock': producto.cantidad || 0,
    'Coste': producto.coste || 0,
    'Precio Venta': producto.precio_venta || 0,
    'Disponibilidad': producto.disponibilidad || 'Disponible',
    'Fecha Creación': producto.fecha_creacion || new Date().toISOString(),
    'Fecha Actualización': producto.fecha_actualizacion || new Date().toISOString()
  }
  
  // Imagen de portada se maneja como attachment, no se incluye en creación básica
  // Se debe manejar por separado si es necesario
  
  return fields
}

// Construye un payload parcial solo con los campos presentes
function productoPartialToAirtable(producto: Partial<ProductoAirtable>): Record<string, any> {
  const fields: Record<string, any> = {}
  
  // Solo incluir campos que realmente estén definidos (no undefined)
  if (producto.codigo !== undefined && producto.codigo !== null) {
    fields['Código'] = String(producto.codigo).trim()
  }
  if (producto.nombre !== undefined && producto.nombre !== null) {
    fields['Nombre'] = String(producto.nombre).trim()
  }
  if (producto.descripcion !== undefined && producto.descripcion !== null) {
    fields['Descripción'] = String(producto.descripcion).trim() || ''
  }
  
  if (producto.categoria !== undefined && producto.categoria !== null) {
    // Normalizar valor: eliminar TODAS las comillas posibles
    let categoriaValor = String(producto.categoria)
      .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas (dobles, simples, escapadas)
      .replace(/\s+/g, ' ')       // Normalizar espacios
      .trim()
    
    // Mapeo exacto de valores válidos en Airtable
    const valoresValidosExactos: Record<string, string> = {
      'categoria general': 'Categoria general',
      'impresion digital': 'Impresion Digital',
      'corte y grabado': 'Corte y Grabado',
      'displays': 'Displays'
    }
    
    // Buscar match case-insensitive
    const categoriaLower = categoriaValor.toLowerCase()
    let categoriaFinal = valoresValidosExactos[categoriaLower]
    
    // Fallback: buscar por contenido
    if (!categoriaFinal) {
      if (categoriaLower.includes('impresion')) {
        categoriaFinal = 'Impresion Digital'
      } else if (categoriaLower.includes('corte') && categoriaLower.includes('grabado')) {
        categoriaFinal = 'Corte y Grabado'
      } else if (categoriaLower.includes('display')) {
        categoriaFinal = 'Displays'
      } else {
        categoriaFinal = 'Categoria general' // Default
      }
    }
    
    // Asegurar salida final sin comillas ni espacios
    fields['Categoría'] = categoriaFinal?.trim().replace(/["""''']+/g, '') || 'Categoria general'
  }
  
  if (producto.responsable !== undefined && producto.responsable !== null) {
    fields['Responsable'] = producto.responsable || ''
  }
  if (producto.unidad_medida !== undefined && producto.unidad_medida !== null) {
    // Limpiar TODAS las comillas y caracteres especiales
    let unidad = producto.unidad_medida || ''
    if (typeof unidad === 'string') {
      // Remover TODAS las comillas, backslashes y normalizar espacios
      unidad = unidad
        .replace(/["""'''\\]+/g, '')  // Eliminar comillas y backslashes
        .replace(/\s+/g, ' ')         // Normalizar espacios
        .trim()
    }
    
    // Aplicar mapeo m2 → m²
    const unidadMapeada = unidad === 'm2' ? 'm²' : unidad
    
    fields['Unidad de Medida'] = unidadMapeada
  }
  if (producto.cantidad !== undefined && producto.cantidad !== null) {
    fields['Stock'] = Number(producto.cantidad) || 0
  }
  if (producto.coste !== undefined && producto.coste !== null) {
    fields['Coste'] = Number(producto.coste) || 0
  }
  if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
    fields['Precio Venta'] = Number(producto.precio_venta) || 0
  }
  if (producto.disponibilidad !== undefined && producto.disponibilidad !== null) {
    fields['Disponibilidad'] = producto.disponibilidad || 'Disponible'
  }
  
  // NO actualizar "Fecha Actualización" - es un campo calculado en Airtable
  // Airtable lo actualiza automáticamente
  
  return fields
}

// Obtener todos los productos
export async function getAllProductos() {
  try {
    const response = await getAllRecords(TABLE_NAME)
    const productos = response.records.map(airtableToProducto)
    return productos
  } catch (error) {
    console.error('Error obteniendo productos de Airtable:', error)
    throw error
  }
}

// Obtener productos con paginación
export async function getProductosPage(page: number = 1, pageSize: number = 25, query?: string, categoria?: string) {
  try {
    // Obtener TODOS los productos primero
    const allProductos = await getAllProductos()
    
    // Aplicar filtros
    let productosFiltrados = allProductos
    
    if (query) {
      productosFiltrados = productosFiltrados.filter(producto => 
        producto.codigo.toLowerCase().includes(query.toLowerCase()) ||
        producto.nombre.toLowerCase().includes(query.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (categoria) {
      // Comparación case-insensitive para categoría
      productosFiltrados = productosFiltrados.filter(producto => 
        producto.categoria?.toLowerCase().trim() === categoria.toLowerCase().trim()
      )
    }
    
    // Calcular paginación
    const total = productosFiltrados.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const data = productosFiltrados.slice(startIndex, endIndex)
    
    return {
      data,
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
    const allProductos = await getAllProductos()
    const producto = allProductos.find(p => p.id === id)
    if (!producto) {
      throw new Error(`Producto con ID ${id} no encontrado`)
    }
    return producto
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error)
    throw error
  }
}

// Crear nuevo producto
export async function createProducto(producto: Partial<ProductoAirtable>) {
  try {
    const fields = productoToAirtable(producto)
    const response = await airtableCreate(TABLE_NAME, [{ fields }])
    return airtableToProducto(response.records[0])
  } catch (error) {
    console.error('Error creando producto en Airtable:', error)
    throw error
  }
}

// Actualizar producto
export async function updateProducto(id: string, producto: Partial<ProductoAirtable>) {
  try {
    console.log('🔄 updateProducto llamado con:')
    console.log('   - ID:', id)
    console.log('   - Producto recibido:', JSON.stringify(producto, null, 2))
    
    const fields = productoPartialToAirtable(producto)
    
    // Asegurar que los valores string no tengan comillas o escapes extra
    Object.keys(fields).forEach(key => {
      if (typeof fields[key] === 'string') {
        fields[key] = String(fields[key])
          .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
          .replace(/\s+/g, ' ')       // Normalizar espacios
          .trim()
      }
    })
    
    console.log('   - Campos que se enviarán a Airtable:', JSON.stringify(fields, null, 2))
    console.log('   - Valor de Categoría exacto:', JSON.stringify(fields['Categoría']))
    
    const response = await airtableUpdate(TABLE_NAME, id, fields)
    console.log('✅ Producto actualizado correctamente en Airtable')
    return airtableToProducto(response)
  } catch (error) {
    console.error('❌ Error actualizando producto en Airtable:', error)
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
    await airtableDelete(TABLE_NAME, id)
  } catch (error) {
    console.error('Error eliminando producto en Airtable:', error)
    throw error
  }
}

