import { airtableList, airtableCreate, airtableUpdate, airtableDelete, getAllRecords, getRecordsPage, airtableGet } from './airtable-rest'

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
  mostrar_en_web?: boolean
  variantes?: any[]
  receta?: any[]
  proveedores?: any[]
  calculadora_de_precios?: any
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
  'Mostrar en Web'?: boolean
  'Variante'?: string // JSON string
  'Receta'?: string // JSON string
  'Proveedores'?: string // JSON string
  'Calculadora de precios'?: string // JSON string
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
  // Intentar diferentes nombres posibles del campo
  let imagenPortada: string | undefined
  
  // Lista de posibles nombres del campo (case-sensitive en Airtable)
  const posiblesNombres = ['Imagen de Portada', 'Imagen de portada', 'imagen de portada', 'Imagen', 'Imagen Principal']
  
  for (const nombreCampo of posiblesNombres) {
    if (fields[nombreCampo]) {
      if (Array.isArray(fields[nombreCampo]) && fields[nombreCampo].length > 0) {
        imagenPortada = fields[nombreCampo][0].url || undefined
        if (imagenPortada) {
          console.log(`🖼️ Imagen de portada cargada desde campo "${nombreCampo}":`, imagenPortada.substring(0, 100))
          break
        }
      } else {
        console.log(`⚠️ Campo "${nombreCampo}" existe pero tiene formato inesperado:`, typeof fields[nombreCampo], fields[nombreCampo])
      }
    }
  }
  
  // Si no se encontró, loguear todos los campos disponibles para debug
  if (!imagenPortada) {
    const camposConImagen = Object.keys(fields).filter(key => 
      key.toLowerCase().includes('imagen') || 
      key.toLowerCase().includes('image') ||
      key.toLowerCase().includes('foto') ||
      key.toLowerCase().includes('photo')
    )
    if (camposConImagen.length > 0) {
      console.log(`⚠️ No se encontró imagen. Campos relacionados encontrados:`, camposConImagen)
    } else {
      console.log(`⚠️ No se encontró campo de imagen. Campos disponibles:`, Object.keys(fields).slice(0, 10))
    }
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
  
  // Parsear mostrar_en_web
  let mostrarEnWeb = false
  if (fields['Mostrar en Web'] !== undefined && fields['Mostrar en Web'] !== null) {
    mostrarEnWeb = Boolean(fields['Mostrar en Web'])
  }
  
  // Parsear variantes desde JSON string
  let variantes: any[] = []
  if (fields['Variante']) {
    try {
      if (typeof fields['Variante'] === 'string') {
        const trimmed = fields['Variante'].trim()
        if (trimmed.length > 0) {
          variantes = JSON.parse(trimmed)
          console.log(`✅ Variantes parseadas para "${fields['Nombre']}"`)
        }
      } else if (Array.isArray(fields['Variante'])) {
        variantes = fields['Variante']
      }
    } catch (e) {
      console.error(`❌ Error parseando Variante de "${fields['Nombre']}":`, e)
      variantes = []
    }
  }
  
  // Parsear receta desde JSON string
  let receta: any[] = []
  if (fields['Receta']) {
    try {
      if (typeof fields['Receta'] === 'string') {
        const trimmed = fields['Receta'].trim()
        if (trimmed.length > 0) {
          receta = JSON.parse(trimmed)
          console.log(`✅ Receta parseada para "${fields['Nombre']}":`, receta.length, 'items')
        }
      } else if (Array.isArray(fields['Receta'])) {
        receta = fields['Receta']
      }
    } catch (e) {
      console.error(`❌ Error parseando Receta de "${fields['Nombre']}":`, e)
      receta = []
    }
  }
  
  // Parsear proveedores desde JSON string
  let proveedores: any[] = []
  if (fields['Proveedores']) {
    try {
      if (typeof fields['Proveedores'] === 'string') {
        const trimmed = fields['Proveedores'].trim()
        if (trimmed.length > 0) {
          proveedores = JSON.parse(trimmed)
          console.log(`✅ Proveedores parseados para "${fields['Nombre']}"`)
        }
      } else if (Array.isArray(fields['Proveedores'])) {
        proveedores = fields['Proveedores']
      }
    } catch (e) {
      console.error(`❌ Error parseando Proveedores de "${fields['Nombre']}":`, e)
      proveedores = []
    }
  }
  
  // Parsear calculadora de precios desde JSON string
  let calculadoraDePrecios: any = null
  if (fields['Calculadora de precios']) {
    try {
      if (typeof fields['Calculadora de precios'] === 'string') {
        const trimmed = fields['Calculadora de precios'].trim()
        if (trimmed.length > 0) {
          calculadoraDePrecios = JSON.parse(trimmed)
          console.log(`✅ Calculadora de precios parseada para "${fields['Nombre']}"`)
        }
      } else if (typeof fields['Calculadora de precios'] === 'object') {
        calculadoraDePrecios = fields['Calculadora de precios']
      }
    } catch (e) {
      console.error(`❌ Error parseando Calculadora de precios de "${fields['Nombre']}":`, e)
      calculadoraDePrecios = null
    }
  }
  
  const resultado = {
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
    mostrar_en_web: mostrarEnWeb,
    variantes: variantes,
    receta: receta,
    proveedores: proveedores,
    calculadora_de_precios: calculadoraDePrecios,
    fecha_creacion: fields['Fecha Creación'] || new Date().toISOString(),
    fecha_actualizacion: fields['Fecha Actualización'] || new Date().toISOString()
  }
  
  console.log('📦 Producto convertido desde Airtable:', {
    id: resultado.id,
    nombre: resultado.nombre,
    tiene_imagen: !!resultado.imagen_portada,
    imagen_url: resultado.imagen_portada?.substring(0, 100),
    tiene_calculadora: !!resultado.calculadora_de_precios
  })
  
  return resultado
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
  
  // Agregar mostrar_en_web si está definido
  if (producto.mostrar_en_web !== undefined && producto.mostrar_en_web !== null) {
    fields['Mostrar en Web'] = Boolean(producto.mostrar_en_web)
  }
  
  // Agregar variantes si están definidas
  if (producto.variantes !== undefined && producto.variantes !== null) {
    try {
      fields['Variante'] = typeof producto.variantes === 'string' 
        ? producto.variantes 
        : JSON.stringify(producto.variantes)
    } catch (e) {
      fields['Variante'] = '[]'
    }
  }
  
  // Agregar receta si está definida
  if (producto.receta !== undefined && producto.receta !== null) {
    try {
      fields['Receta'] = typeof producto.receta === 'string' 
        ? producto.receta 
        : JSON.stringify(producto.receta)
    } catch (e) {
      fields['Receta'] = '[]'
    }
  }
  
  // Agregar proveedores si están definidos
  if (producto.proveedores !== undefined && producto.proveedores !== null) {
    try {
      fields['Proveedores'] = typeof producto.proveedores === 'string' 
        ? producto.proveedores 
        : JSON.stringify(producto.proveedores)
    } catch (e) {
      fields['Proveedores'] = '[]'
    }
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
  
  // Guardar mostrar_en_web
  if (producto.mostrar_en_web !== undefined && producto.mostrar_en_web !== null) {
    fields['Mostrar en Web'] = Boolean(producto.mostrar_en_web)
  }
  
  // Guardar variantes como JSON string
  // IMPORTANTE: Guardar siempre, incluso si es un array vacío, para limpiar el campo si es necesario
  if (producto.variantes !== undefined) {
    try {
      if (producto.variantes === null || (Array.isArray(producto.variantes) && producto.variantes.length === 0)) {
        fields['Variante'] = '[]'
        console.log('📦 Variantes guardadas (vacío): []')
      } else {
        fields['Variante'] = typeof producto.variantes === 'string' 
          ? producto.variantes 
          : JSON.stringify(producto.variantes)
        console.log('📦 Variantes guardadas:', fields['Variante'].substring(0, 100) + '...')
      }
    } catch (e) {
      console.error('Error serializando Variante:', e)
      fields['Variante'] = '[]'
    }
  }
  
  // Guardar receta como JSON string
  if (producto.receta !== undefined && producto.receta !== null) {
    try {
      fields['Receta'] = typeof producto.receta === 'string' 
        ? producto.receta 
        : JSON.stringify(producto.receta)
      console.log('📦 Receta guardada:', fields['Receta'])
    } catch (e) {
      console.error('Error serializando Receta:', e)
      fields['Receta'] = '[]'
    }
  }
  
  // Guardar proveedores como JSON string
  if (producto.proveedores !== undefined && producto.proveedores !== null) {
    try {
      fields['Proveedores'] = typeof producto.proveedores === 'string' 
        ? producto.proveedores 
        : JSON.stringify(producto.proveedores)
      console.log('📦 Proveedores guardados:', fields['Proveedores'])
    } catch (e) {
      console.error('Error serializando Proveedores:', e)
      fields['Proveedores'] = '[]'
    }
  }
  
  // Guardar calculadora de precios como JSON string (EXACTAMENTE igual que receta)
  if (producto.calculadora_de_precios !== undefined && producto.calculadora_de_precios !== null) {
    try {
      fields['Calculadora de precios'] = typeof producto.calculadora_de_precios === 'string' 
        ? producto.calculadora_de_precios 
        : JSON.stringify(producto.calculadora_de_precios)
      console.log('📦 Calculadora de precios guardada:', fields['Calculadora de precios'])
    } catch (e) {
      console.error('Error serializando Calculadora de precios:', e)
      fields['Calculadora de precios'] = '{}'
    }
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
    console.log('   - calculadora_de_precios recibido:', producto.calculadora_de_precios)
    console.log('   - calculadora_de_precios tipo:', typeof producto.calculadora_de_precios)
    console.log('   - calculadora_de_precios undefined?', producto.calculadora_de_precios === undefined)
    
    const allFields = productoPartialToAirtable(producto)
    console.log('   - allFields después de productoPartialToAirtable:', Object.keys(allFields))
    console.log('   - Calculadora de precios en allFields?', 'Calculadora de precios' in allFields)
    
    // Separar campos obligatorios de campos opcionales (que pueden no existir en Airtable)
    // NOTA: Variante, Receta, Proveedores y Calculadora de precios son campos que SÍ existen en Airtable, pero los tratamos como opcionales
    // para que si fallan, no rompan el guardado del resto de campos
    const camposOpcionales = ['Variante', 'Receta', 'Proveedores', 'Calculadora de precios']
    const camposObligatorios: Record<string, any> = {}
    const camposOpcionalesData: Record<string, any> = {}
    
    Object.keys(allFields).forEach(key => {
      if (camposOpcionales.includes(key)) {
        camposOpcionalesData[key] = allFields[key]
        console.log(`✅ Campo opcional "${key}" agregado desde allFields`)
      } else {
        camposObligatorios[key] = allFields[key]
      }
    })
    
    // Si hay variantes, receta o proveedores, asegurarse de que se intenten guardar
    // incluso si están vacíos (para limpiar el campo si es necesario)
    if (producto.variantes !== undefined) {
      // Si allFields no tiene Variante, crearlo desde producto.variantes
      if (!allFields['Variante']) {
        try {
          camposOpcionalesData['Variante'] = Array.isArray(producto.variantes) && producto.variantes.length > 0
            ? JSON.stringify(producto.variantes)
            : '[]'
        } catch (e) {
          console.error('Error serializando variantes:', e)
          camposOpcionalesData['Variante'] = '[]'
        }
      } else {
        camposOpcionalesData['Variante'] = allFields['Variante']
      }
    }
    if (producto.receta !== undefined) {
      if (!allFields['Receta']) {
        try {
          camposOpcionalesData['Receta'] = Array.isArray(producto.receta) && producto.receta.length > 0
            ? JSON.stringify(producto.receta)
            : '[]'
        } catch (e) {
          console.error('Error serializando receta:', e)
          camposOpcionalesData['Receta'] = '[]'
        }
      } else {
        camposOpcionalesData['Receta'] = allFields['Receta']
      }
    }
    if (producto.proveedores !== undefined) {
      if (!allFields['Proveedores']) {
        try {
          camposOpcionalesData['Proveedores'] = Array.isArray(producto.proveedores) && producto.proveedores.length > 0
            ? JSON.stringify(producto.proveedores)
            : '[]'
        } catch (e) {
          console.error('Error serializando proveedores:', e)
          camposOpcionalesData['Proveedores'] = '[]'
        }
      } else {
        camposOpcionalesData['Proveedores'] = allFields['Proveedores']
      }
    }
    
    // FORZAR calculadora de precios si está definida
    console.log('🔍 Verificando calculadora_de_precios:', {
      esta_definida: producto.calculadora_de_precios !== undefined,
      tipo: typeof producto.calculadora_de_precios,
      valor_preview: JSON.stringify(producto.calculadora_de_precios)?.substring(0, 100)
    })
    
    if (producto.calculadora_de_precios !== undefined) {
      console.log('🔍 allFields tiene Calculadora de precios?', 'Calculadora de precios' in allFields)
      console.log('🔍 allFields["Calculadora de precios"]:', allFields['Calculadora de precios'])
      
      if (!allFields['Calculadora de precios']) {
        // No está en allFields, serializar aquí
        try {
          const json = typeof producto.calculadora_de_precios === 'string'
            ? producto.calculadora_de_precios
            : JSON.stringify(producto.calculadora_de_precios)
          camposOpcionalesData['Calculadora de precios'] = json
          console.log('📊 ✅ Calculadora de precios CREADA y agregada a camposOpcionalesData')
          console.log('📊 Valor:', json.substring(0, 200))
        } catch (e) {
          console.error('❌ Error serializando calculadora de precios:', e)
          camposOpcionalesData['Calculadora de precios'] = '{}'
        }
      } else {
        // Ya está en allFields, usar ese valor
        camposOpcionalesData['Calculadora de precios'] = allFields['Calculadora de precios']
        console.log('📊 ✅ Calculadora de precios TOMADA de allFields y agregada a camposOpcionalesData')
        console.log('📊 Valor:', allFields['Calculadora de precios'].substring(0, 200))
      }
    } else {
      console.log('⚠️ calculadora_de_precios es undefined, NO se agregará')
    }
    
    // Asegurar que los valores string no tengan comillas o escapes extra
    Object.keys(camposObligatorios).forEach(key => {
      if (typeof camposObligatorios[key] === 'string') {
        camposObligatorios[key] = String(camposObligatorios[key])
          .replace(/["""''']+/g, '')  // Eliminar TODAS las comillas
          .replace(/\s+/g, ' ')       // Normalizar espacios
          .trim()
      }
    })
    
    console.log('   - Campos obligatorios que se enviarán:', JSON.stringify(camposObligatorios, null, 2))
    console.log('   - Campos opcionales:', Object.keys(camposOpcionalesData))
    
    // 👇 OPTIMIZACIÓN: Guardar todos los campos en una sola llamada (obligatorios + opcionales)
    const todosLosCampos = { ...camposObligatorios, ...camposOpcionalesData }
    console.log('📋 Campos totales a guardar:', Object.keys(todosLosCampos))
    
    let response: any = null
    
    try {
      // Guardar todos los campos de una vez
      response = await airtableUpdate(TABLE_NAME, id, todosLosCampos)
      console.log('✅ Todos los campos guardados correctamente en una sola llamada')
    } catch (e: any) {
      console.error(`❌ ERROR guardando campos:`, e?.response?.data ?? e?.message ?? e)
      
      // Si falla, verificar si es por Calculadora de precios
      if (String(e).includes('UNKNOWN_FIELD_NAME') && String(e).includes('Calculadora de precios')) {
        throw new Error(`Error guardando Calculadora de precios: ${e?.message ?? e}`)
      }
      
      // Si falla con todos los campos, intentar guardar por separado como fallback
      console.log('⚠️ Fallback: intentando guardar campos por separado...')
      
      // Primero campos obligatorios
      response = await airtableUpdate(TABLE_NAME, id, camposObligatorios)
      console.log('✅ Campos obligatorios guardados correctamente')
      
      // Luego opcionales uno a uno
      const camposParaGuardar = Object.keys(camposOpcionalesData)
      for (const campoNombre of camposParaGuardar) {
        const campoData = { [campoNombre]: camposOpcionalesData[campoNombre] }
        try {
          response = await airtableUpdate(TABLE_NAME, id, campoData)
          console.log(`✅ Campo "${campoNombre}" guardado correctamente`)
        } catch (campoError: any) {
          console.error(`❌ ERROR guardando "${campoNombre}":`, campoError?.response?.data ?? campoError?.message ?? campoError)
          if (String(campoError).includes('UNKNOWN_FIELD_NAME')) {
            console.error(`⚠️ Revisa el nombre EXACTO del campo en Airtable: "${campoNombre}"`)
          }
          // ❗ NO silenciar error de Calculadora de precios
          if (campoNombre === 'Calculadora de precios') {
            throw new Error(`Error guardando Calculadora de precios: ${campoError?.message ?? campoError}`)
          }
        }
      }
    }
    
    // Obtener el producto actualizado para retornarlo
    const productoActualizado = await airtableGet(TABLE_NAME, id)
    console.log('✅ Producto actualizado correctamente en Airtable')
    return airtableToProducto({ id: productoActualizado.id, fields: productoActualizado.fields || productoActualizado })
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

