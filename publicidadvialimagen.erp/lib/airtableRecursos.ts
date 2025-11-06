import { airtableList, airtableCreate, airtableUpdate, airtableDelete, airtableGet, getAllRecords, getRecordsPage } from './airtable-rest'

const TABLE_NAME = 'Recursos'

export interface RecursoAirtable {
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
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface RecursoAirtableFields {
  'Código': string
  'Nombre': string
  'Descripción'?: string
  'Categoría': 'Insumos' | 'Mano de Obra'
  'Responsable': string
  'Unidad de Medida': string
  'Stock': number
  'Coste': number
  'Variantes'?: string
  // 'Precio Venta' no existe en Airtable - campo comentado
  // 'Precio Venta'?: number
  'Fecha Creación': string
  'Fecha Actualización': string
}

// Convertir de Airtable a formato interno
export function airtableToRecurso(record: any): RecursoAirtable {
  const fields = record.fields
  
  // Mapear unidades de Airtable al formato del frontend
  // Si Airtable tiene "m²" (superíndice), convertir a "m2" para el Select
  let unidadMedida = fields['Unidad de Medida'] || ''
  if (unidadMedida === 'm²') {
    console.log('🔄 Convirtiendo unidad de Airtable:', 'm²', '→', 'm2')
    unidadMedida = 'm2'
  }
  
  // Manejar imagen principal (attachment)
  let imagenPortada: string | undefined
  if (fields['Imagen Principal'] && Array.isArray(fields['Imagen Principal']) && fields['Imagen Principal'].length > 0) {
    imagenPortada = fields['Imagen Principal'][0].url || undefined
  }
  
  // Parsear variantes desde JSON string
  let variantes: any[] = []
  if (fields['Variantes']) {
    try {
      variantes = typeof fields['Variantes'] === 'string' 
        ? JSON.parse(fields['Variantes']) 
        : fields['Variantes']
    } catch (e) {
      console.error('Error parseando variantes:', e)
      variantes = []
    }
  }
  
  return {
    id: record.id,
    codigo: fields['Código'] || '',
    nombre: fields['Nombre'] || '',
    descripcion: fields['Descripción'] || '',
    imagen_portada: imagenPortada,
    categoria: fields['Categoría'] || 'Insumos',
    responsable: fields['Responsable'] || '',
    unidad_medida: unidadMedida,
    cantidad: fields['Stock'] || 0,
    coste: fields['Coste'] || 0,
    precio_venta: fields['Precio Venta'] || 0,
    variantes: variantes,
    fecha_creacion: fields['Fecha Creación'] || new Date().toISOString(),
    fecha_actualizacion: fields['Fecha Actualización'] || new Date().toISOString()
  }
}

// Convertir de formato interno a Airtable (solo campos que existen en Airtable)
export function recursoToAirtable(recurso: Partial<RecursoAirtable>): Partial<RecursoAirtableFields> {
  // Aplicar mapeo de unidades (m2 → m²)
  let unidadMedida = recurso.unidad_medida || ''
  if (unidadMedida === 'm2') {
    console.log('🔄 [CREATE] Convirtiendo unidad:', 'm2', '→', 'm²')
    unidadMedida = 'm²'
  }
  
  const fields: Partial<RecursoAirtableFields> = {
    'Código': recurso.codigo || '',
    'Nombre': recurso.nombre || '',
    'Descripción': recurso.descripcion || '',
    'Categoría': recurso.categoria || 'Insumos',
    'Responsable': recurso.responsable || '',
    'Unidad de Medida': unidadMedida,
    'Stock': recurso.cantidad || 0,
    'Coste': recurso.coste || 0,
    'Fecha Creación': recurso.fecha_creacion || new Date().toISOString(),
    'Fecha Actualización': recurso.fecha_actualizacion || new Date().toISOString()
  }
  
  // Solo incluir Precio Venta si existe en el recurso Y el campo existe en Airtable
  // (Comentado porque el campo no existe en tu Airtable)
  // if (recurso.precio_venta !== undefined) {
  //   fields['Precio Venta'] = recurso.precio_venta
  // }
  
  return fields
}

// Construye un payload parcial solo con los campos presentes
function recursoPartialToAirtable(recurso: Partial<RecursoAirtable>): Record<string, any> {
  const fields: Record<string, any> = {}
  
  // Solo incluir campos que realmente estén definidos (no undefined)
  if (recurso.codigo !== undefined && recurso.codigo !== null) {
    fields['Código'] = recurso.codigo
  }
  if (recurso.nombre !== undefined && recurso.nombre !== null) {
    fields['Nombre'] = recurso.nombre
  }
  if (recurso.descripcion !== undefined && recurso.descripcion !== null) {
    fields['Descripción'] = recurso.descripcion || ''
  }
  
  if (recurso.categoria !== undefined && recurso.categoria !== null) {
    // Normalizar valores permitidos
    const cat = recurso.categoria || ''
    fields['Categoría'] = cat === 'Mano de Obra' ? 'Mano de Obra' : 'Insumos'
  }
  
  if (recurso.responsable !== undefined && recurso.responsable !== null) {
    fields['Responsable'] = recurso.responsable || ''
  }
  if (recurso.unidad_medida !== undefined && recurso.unidad_medida !== null) {
    // Limpiar TODO: comillas, escapes, espacios extras
    let unidad = recurso.unidad_medida || ''
    if (typeof unidad === 'string') {
      // Remover TODAS las comillas y backslashes
      unidad = unidad.trim().replace(/[\\'"]/g, '')
    }
    
    // Log ultra detallado para debug
    console.log('   📏 Unidad de Medida - ANÁLISIS DETALLADO:')
    console.log('      Original value:', JSON.stringify(recurso.unidad_medida))
    console.log('      Original charCodes:', Array.from(String(recurso.unidad_medida || '')).map(c => c.charCodeAt(0)))
    console.log('      Cleaned value:', JSON.stringify(unidad))
    console.log('      Cleaned charCodes:', Array.from(String(unidad)).map(c => c.charCodeAt(0)))
    console.log('      Length:', unidad.length)
    console.log('      Type:', typeof unidad)
    
    // WORKAROUND TEMPORAL: Si Airtable tiene "m²" en lugar de "m2"
    // Mapear de lo que muestra el frontend a lo que espera Airtable
    const unidadMapeada = unidad === 'm2' ? 'm²' : unidad
    
    if (unidad !== unidadMapeada) {
      console.log('      ⚠️ MAPEO APLICADO:', unidad, '→', unidadMapeada)
    }
    
    fields['Unidad de Medida'] = unidadMapeada
  }
  if (recurso.cantidad !== undefined && recurso.cantidad !== null) {
    fields['Stock'] = Number(recurso.cantidad) || 0
  }
  if (recurso.coste !== undefined && recurso.coste !== null) {
    fields['Coste'] = Number(recurso.coste) || 0
  }
  
  // Guardar variantes como JSON string
  if (recurso.variantes !== undefined && recurso.variantes !== null) {
    try {
      fields['Variantes'] = typeof recurso.variantes === 'string' 
        ? recurso.variantes 
        : JSON.stringify(recurso.variantes)
    } catch (e) {
      console.error('Error serializando variantes:', e)
      fields['Variantes'] = '[]'
    }
  }
  
  // Manejar imagen principal (attachment)
  if (recurso.imagen_portada !== undefined) {
    if (recurso.imagen_portada === null || recurso.imagen_portada === '') {
      // Eliminar imagen
      fields['Imagen Principal'] = []
    } else {
      const rawUrl = String(recurso.imagen_portada).trim()
      if (rawUrl && !rawUrl.startsWith('blob:')) {
        // Convertir URL relativa a absoluta
        let imagenUrl: string
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
          imagenUrl = rawUrl // Ya es absoluta
        } else {
          // Convertir URL relativa a absoluta
          const baseUrl = process.env.PUBLIC_SITE_URL ||
            process.env.NEXTAUTH_URL || 
            process.env.NEXT_PUBLIC_BASE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          
          imagenUrl = `${baseUrl}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`
        }
        
        // Formato correcto para Airtable attachments con URL
        fields['Imagen Principal'] = [{ url: imagenUrl }]
      }
    }
  }
  
  // Precio Venta comentado - el campo no existe en Airtable
  // if (recurso.precio_venta !== undefined && recurso.precio_venta !== null) {
  //   fields['Precio Venta'] = Number(recurso.precio_venta) || 0
  // }
  
  // NO actualizar "Fecha Actualización" - es un campo calculado en Airtable
  // Airtable lo actualiza automáticamente
  
  return fields
}

// Obtener todos los recursos
export async function getAllRecursos() {
  try {
    const response = await getAllRecords(TABLE_NAME)
    const recursos = response.records.map(airtableToRecurso)
    
    // Si no hay datos en Airtable, devolver datos de ejemplo para testing
    if (recursos.length === 0) {
      console.log('No hay datos en Airtable, usando datos de ejemplo para testing')
      return generateSampleData()
    }
    
    return recursos
  } catch (error) {
    console.error('Error obteniendo recursos de Airtable:', error)
    // En caso de error, devolver datos de ejemplo para testing
    console.log('Error en Airtable, usando datos de ejemplo para testing')
    return generateSampleData()
  }
}

// Generar datos de ejemplo para testing
function generateSampleData() {
  const sampleData = []
  const categorias = ['Insumos', 'Mano de Obra']
  const unidades = ['m2', 'kg', 'm', 'L', 'unidad', 'hora', 'km']
  const responsables = ['Ana Martínez', 'Carlos López', 'María García', 'Pedro Ruiz', 'Laura Sánchez', 'Juan Pérez', 'Elena Torres', 'Roberto Silva']
  
  for (let i = 1; i <= 120; i++) { // 120 items para probar paginación (3 páginas de 50)
    const categoria = categorias[i % 2]
    const prefijo = categoria === 'Insumos' ? 'INS' : 'MDO'
    
    sampleData.push({
      id: `sample-${i}`,
      codigo: `${prefijo}-${i.toString().padStart(3, '0')}`,
      nombre: `Recurso de Prueba ${i}`,
      descripcion: `Descripción del recurso ${i}`,
      categoria: categoria as 'Insumos' | 'Mano de Obra',
      responsable: responsables[i % responsables.length],
      unidad_medida: unidades[i % unidades.length],
      cantidad: Math.floor(Math.random() * 100) + 1,
      coste: Math.round((Math.random() * 100 + 10) * 100) / 100,
      precio_venta: Math.round((Math.random() * 150 + 20) * 100) / 100,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    })
  }
  
  return sampleData
}

// Obtener recursos con paginación
export async function getRecursosPage(page: number = 1, pageSize: number = 50, query?: string, categoria?: string) {
  try {
    // Obtener TODOS los recursos primero
    const allRecursos = await getAllRecursos()
    
    // Aplicar filtros
    let recursosFiltrados = allRecursos
    
    if (query) {
      recursosFiltrados = recursosFiltrados.filter(recurso => 
        recurso.codigo.toLowerCase().includes(query.toLowerCase()) ||
        recurso.nombre.toLowerCase().includes(query.toLowerCase()) ||
        recurso.categoria.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    if (categoria) {
      recursosFiltrados = recursosFiltrados.filter(recurso => recurso.categoria === categoria)
    }
    
    // Calcular paginación
    const total = recursosFiltrados.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const data = recursosFiltrados.slice(startIndex, endIndex)
    
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
    console.error('Error obteniendo página de recursos:', error)
    throw error
  }
}

// Crear nuevo recurso
export async function createRecurso(recurso: Partial<RecursoAirtable>) {
  try {
    const fields = recursoToAirtable(recurso)
    const response = await airtableCreate(TABLE_NAME, [{ fields }])
    return airtableToRecurso(response.records[0])
  } catch (error) {
    console.error('Error creando recurso en Airtable:', error)
    throw error
  }
}

// Actualizar recurso
export async function updateRecurso(id: string, recurso: Partial<RecursoAirtable>) {
  try {
    console.log('🔄 updateRecurso llamado con:')
    console.log('   - ID:', id)
    console.log('   - Recurso recibido:', JSON.stringify(recurso, null, 2))
    
    const fields = recursoPartialToAirtable(recurso)
    console.log('   - Campos que se enviarán a Airtable:', JSON.stringify(fields, null, 2))
    
    const response = await airtableUpdate(TABLE_NAME, id, fields)
    console.log('✅ Recurso actualizado correctamente en Airtable')
    return airtableToRecurso(response)
  } catch (error) {
    console.error('❌ Error actualizando recurso en Airtable:', error)
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
    await airtableDelete(TABLE_NAME, id)
    return { success: true }
  } catch (error) {
    console.error('Error eliminando recurso en Airtable:', error)
    throw error
  }
}

// Obtener recurso por ID
export async function getRecursoById(id: string) {
  try {
    console.log('🔍 Obteniendo recurso por ID directo:', id)
    const record = await airtableGet(TABLE_NAME, id)
    console.log('✅ Recurso obtenido:', record)
    return airtableToRecurso(record)
  } catch (error) {
    console.error('❌ Error obteniendo recurso por ID:', error)
    throw error
  }
}
