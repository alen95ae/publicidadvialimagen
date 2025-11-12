import { airtableList, airtableCreate, airtableUpdate, airtableDelete, getAllRecords, getRecordsPage, airtableGet } from './airtable-rest'

const TABLE_COTIZACIONES = 'Cotizaciones'
const TABLE_LINEAS = 'Líneas de Cotización'

// ============================================
// INTERFACES - COTIZACIONES
// ============================================

export interface CotizacionAirtable {
  id: string
  codigo: string
  fecha_creacion: string
  fecha_actualizacion: string
  cliente: string
  vendedor: string
  sucursal: string
  estado: 'Pendiente' | 'En Proceso' | 'Aprobada' | 'Rechazada'
  subtotal: number
  total_iva: number
  total_it: number
  total_final: number
  notas_generales?: string
  terminos_condiciones?: string
  vigencia_dias?: number
  lineas?: string[] // IDs de las líneas relacionadas
  cantidad_items?: number // Rollup desde Airtable
}

export interface CotizacionAirtableFields {
  'Código': string
  'Fecha Creación': string
  'Fecha Actualización': string
  'Cliente': string
  'Vendedor': string
  'Sucursal': string
  'Estado': 'Pendiente' | 'En Proceso' | 'Aprobada' | 'Rechazada'
  'Subtotal': number
  'Total IVA': number
  'Total IT': number
  'Total Final': number
  'Notas Generales'?: string
  'Términos y Condiciones'?: string
  'Vigencia (días)'?: number
  'Líneas'?: string[] // Campo de vinculación
}

// ============================================
// INTERFACES - LÍNEAS DE COTIZACIÓN
// ============================================

export interface LineaCotizacionAirtable {
  id: string
  cotizacion_id?: string // ID de la cotización padre
  tipo: 'Producto' | 'Nota' | 'Sección'
  codigo_producto?: string
  nombre_producto?: string
  descripcion?: string
  cantidad: number
  ancho?: number
  alto?: number
  total_m2?: number
  unidad_medida: string
  precio_unitario: number
  comision_porcentaje: number
  con_iva: boolean
  con_it: boolean
  es_soporte: boolean
  orden: number
  imagen?: string // URL del attachment
  variantes?: string // JSON string
  subtotal_linea: number
}

export interface LineaCotizacionAirtableFields {
  'ID Línea'?: number // Autonumber (opcional al crear)
  'Cotización': string[] // Link to record - Array con el ID de la cotización
  'Tipo': 'Producto' | 'Nota' | 'Sección'
  'Código Producto'?: string
  'Nombre Producto'?: string
  'Descripción'?: string
  'Cantidad': number
  'Ancho (m)'?: number
  'Alto (m)'?: number
  // 'Total M²' es calculado por Airtable
  'Unidad de Medida': string
  'Precio Unitario': number
  'Comisión %': number
  'Con IVA': boolean
  'Con IT': boolean
  'Es Soporte': boolean
  'Orden': number
  'Imagen'?: any[] // Attachment
  'Variantes'?: string
  'Subtotal Línea': number
}

// ============================================
// CONVERTIDORES - COTIZACIONES
// ============================================

export function airtableToCotizacion(record: any): CotizacionAirtable {
  const fields = record.fields
  
  // Usar createdTime del record de Airtable para fecha_creacion
  const fechaCreacion = record.createdTime || fields['Fecha Creación'] || new Date().toISOString()
  
  // Usar Fecha Actualización de Airtable (campo computado) para fecha_actualizacion
  const fechaActualizacion = fields['Fecha Actualización'] || record.createdTime || new Date().toISOString()
  
  return {
    id: record.id,
    codigo: fields['Código'] || '',
    fecha_creacion: fechaCreacion,
    fecha_actualizacion: fechaActualizacion,
    cliente: fields['Cliente'] || '',
    vendedor: fields['Vendedor'] || '',
    sucursal: fields['Sucursal'] || 'La Paz',
    estado: fields['Estado'] || 'Pendiente',
    subtotal: fields['Subtotal'] || 0,
    total_iva: fields['Total IVA'] || 0,
    total_it: fields['Total IT'] || 0,
    total_final: fields['Total Final'] || 0,
    notas_generales: fields['Notas Generales'] || '',
    terminos_condiciones: fields['Términos y Condiciones'] || '',
    vigencia_dias: fields['Vigencia (días)'] || 30,
    lineas: fields['Líneas'] || [],
    cantidad_items: fields['Cantidad de Items'] || 0
  }
}

export function cotizacionToAirtable(cotizacion: Partial<CotizacionAirtable>): Partial<CotizacionAirtableFields> {
  const fields: Partial<CotizacionAirtableFields> = {
    'Código': cotizacion.codigo || '',
    'Cliente': cotizacion.cliente || '',
    'Vendedor': cotizacion.vendedor || '',
    'Sucursal': cotizacion.sucursal || 'La Paz',
    'Estado': cotizacion.estado || 'Pendiente',
    'Subtotal': cotizacion.subtotal || 0,
    'Total IVA': cotizacion.total_iva || 0,
    'Total IT': cotizacion.total_it || 0,
    'Total Final': cotizacion.total_final || 0,
  }

  // NO enviar Fecha Creación - Airtable usa "Created time" automático
  // NO enviar Fecha Actualización - Airtable usa "Last modified time" automático
  // Estos campos son computados y no se pueden escribir

  // Campos opcionales
  if (cotizacion.notas_generales !== undefined) {
    fields['Notas Generales'] = cotizacion.notas_generales
  }
  if (cotizacion.terminos_condiciones !== undefined) {
    fields['Términos y Condiciones'] = cotizacion.terminos_condiciones
  }
  if (cotizacion.vigencia_dias !== undefined) {
    fields['Vigencia (días)'] = cotizacion.vigencia_dias
  }

  return fields
}

// ============================================
// CONVERTIDORES - LÍNEAS DE COTIZACIÓN
// ============================================

export function airtableToLineaCotizacion(record: any): LineaCotizacionAirtable {
  const fields = record.fields
  
  // Extraer URL de imagen si existe
  let imagenUrl: string | undefined
  if (fields['Imagen'] && Array.isArray(fields['Imagen']) && fields['Imagen'].length > 0) {
    imagenUrl = fields['Imagen'][0].url
  }

  // Obtener ID de cotización del campo de vinculación
  let cotizacionId: string | undefined
  if (fields['Cotización'] && Array.isArray(fields['Cotización']) && fields['Cotización'].length > 0) {
    cotizacionId = fields['Cotización'][0]
  }

  return {
    id: record.id,
    cotizacion_id: cotizacionId,
    tipo: fields['Tipo'] || 'Producto',
    codigo_producto: fields['Código Producto'] || '',
    nombre_producto: fields['Nombre Producto'] || '',
    descripcion: fields['Descripción'] || '',
    cantidad: fields['Cantidad'] || 0,
    ancho: fields['Ancho (m)'] || 0,
    alto: fields['Alto (m)'] || 0,
    total_m2: fields['Total M²'] || 0,
    unidad_medida: fields['Unidad de Medida'] || 'm²',
    precio_unitario: fields['Precio Unitario'] || 0,
    comision_porcentaje: fields['Comisión %'] || 0,
    con_iva: fields['Con IVA'] !== undefined ? fields['Con IVA'] : true,
    con_it: fields['Con IT'] !== undefined ? fields['Con IT'] : true,
    es_soporte: fields['Es Soporte'] || false,
    orden: fields['Orden'] || 0,
    imagen: imagenUrl,
    variantes: fields['Variantes'] || '',
    subtotal_linea: fields['Subtotal Línea'] || 0
  }
}

export function lineaCotizacionToAirtable(linea: Partial<LineaCotizacionAirtable>, cotizacionId: string): Partial<LineaCotizacionAirtableFields> {
  const fields: Partial<LineaCotizacionAirtableFields> = {
    'Cotización': [cotizacionId], // IMPORTANTE: Array con el ID de la cotización
    'Tipo': linea.tipo || 'Producto',
    'Cantidad': linea.cantidad || 0,
    'Unidad de Medida': linea.unidad_medida || 'm²',
    'Precio Unitario': linea.precio_unitario || 0,
    'Comisión %': linea.comision_porcentaje || 0,
    'Con IVA': linea.con_iva !== undefined ? linea.con_iva : true,
    'Con IT': linea.con_it !== undefined ? linea.con_it : true,
    'Es Soporte': linea.es_soporte || false,
    'Orden': linea.orden || 0,
    'Subtotal Línea': linea.subtotal_linea || 0
  }

  // Campos opcionales
  if (linea.codigo_producto) fields['Código Producto'] = linea.codigo_producto
  if (linea.nombre_producto) fields['Nombre Producto'] = linea.nombre_producto
  if (linea.descripcion) fields['Descripción'] = linea.descripcion
  if (linea.ancho !== undefined) fields['Ancho (m)'] = linea.ancho
  if (linea.alto !== undefined) fields['Alto (m)'] = linea.alto
  if (linea.variantes) fields['Variantes'] = linea.variantes

  return fields
}

// ============================================
// FUNCIONES CRUD - COTIZACIONES
// ============================================

export async function getCotizaciones(options?: { 
  filterByFormula?: string,
  pageSize?: number,
  offset?: string,
  view?: string 
}) {
  try {
    const response = await getRecordsPage(TABLE_COTIZACIONES, options)
    const cotizaciones = response.records.map(airtableToCotizacion)
    return {
      cotizaciones,
      offset: response.offset
    }
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error)
    throw error
  }
}

export async function getAllCotizaciones() {
  try {
    const response = await getAllRecords(TABLE_COTIZACIONES)
    return response.records.map(airtableToCotizacion)
  } catch (error) {
    console.error('Error obteniendo todas las cotizaciones:', error)
    throw error
  }
}

export async function getCotizacionById(id: string) {
  try {
    const record = await airtableGet(TABLE_COTIZACIONES, id)
    return airtableToCotizacion(record)
  } catch (error) {
    console.error('Error obteniendo cotización:', error)
    throw error
  }
}

export async function createCotizacion(cotizacion: Partial<CotizacionAirtable>) {
  try {
    const fields = cotizacionToAirtable(cotizacion)
    const response = await airtableCreate(TABLE_COTIZACIONES, [{ fields }])
    return airtableToCotizacion(response.records[0])
  } catch (error) {
    console.error('Error creando cotización:', error)
    throw error
  }
}

export async function updateCotizacion(id: string, cotizacion: Partial<CotizacionAirtable>) {
  try {
    const fields = cotizacionToAirtable(cotizacion)
    const response = await airtableUpdate(TABLE_COTIZACIONES, id, fields)
    return airtableToCotizacion(response)
  } catch (error) {
    console.error('Error actualizando cotización:', error)
    throw error
  }
}

export async function deleteCotizacion(id: string) {
  try {
    await airtableDelete(TABLE_COTIZACIONES, id)
    return { success: true }
  } catch (error) {
    console.error('Error eliminando cotización:', error)
    throw error
  }
}

// ============================================
// FUNCIONES CRUD - LÍNEAS DE COTIZACIÓN
// ============================================

export async function getLineasByCotizacionId(cotizacionId: string) {
  try {
    console.log('🔍 Buscando líneas para cotización ID:', cotizacionId)
    
    // TEMPORAL: Obtener todas las líneas y filtrar manualmente
    // Esto es menos eficiente pero más confiable para debugging
    const response = await airtableList(TABLE_LINEAS, {})
    
    console.log('📝 Total de líneas en la tabla:', response.records?.length || 0)
    
    if (!response.records || response.records.length === 0) {
      console.log('⚠️ No hay líneas en la tabla')
      return []
    }
    
    // Filtrar manualmente las líneas que pertenecen a esta cotización
    const lineasFiltradas = response.records.filter((record: any) => {
      const cotizacionField = record.fields['Cotización']
      if (Array.isArray(cotizacionField)) {
        const match = cotizacionField.includes(cotizacionId)
        if (match) {
          console.log('✅ Línea encontrada:', record.id)
        }
        return match
      }
      return false
    })
    
    console.log('📝 Líneas filtradas para esta cotización:', lineasFiltradas.length)
    
    return lineasFiltradas.map(airtableToLineaCotizacion)
  } catch (error) {
    console.error('❌ Error completo obteniendo líneas de cotización:', error)
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack')
    // No lanzar el error, devolver array vacío para que la cotización al menos cargue
    return []
  }
}

export async function createLineaCotizacion(linea: Partial<LineaCotizacionAirtable>, cotizacionId: string) {
  try {
    const fields = lineaCotizacionToAirtable(linea, cotizacionId)
    const response = await airtableCreate(TABLE_LINEAS, [{ fields }])
    return airtableToLineaCotizacion(response.records[0])
  } catch (error) {
    console.error('Error creando línea de cotización:', error)
    throw error
  }
}

export async function createMultipleLineasCotizacion(lineas: Partial<LineaCotizacionAirtable>[], cotizacionId: string) {
  try {
    const records = lineas.map(linea => ({
      fields: lineaCotizacionToAirtable(linea, cotizacionId)
    }))
    
    // Airtable permite máximo 10 registros por batch
    const batchSize = 10
    const results = []
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const response = await airtableCreate(TABLE_LINEAS, batch)
      results.push(...response.records.map(airtableToLineaCotizacion))
    }
    
    return results
  } catch (error) {
    console.error('Error creando líneas de cotización:', error)
    throw error
  }
}

export async function updateLineaCotizacion(id: string, linea: Partial<LineaCotizacionAirtable>, cotizacionId: string) {
  try {
    const fields = lineaCotizacionToAirtable(linea, cotizacionId)
    const response = await airtableUpdate(TABLE_LINEAS, id, fields)
    return airtableToLineaCotizacion(response)
  } catch (error) {
    console.error('Error actualizando línea de cotización:', error)
    throw error
  }
}

export async function deleteLineaCotizacion(id: string) {
  try {
    await airtableDelete(TABLE_LINEAS, id)
    return { success: true }
  } catch (error) {
    console.error('Error eliminando línea de cotización:', error)
    throw error
  }
}

// ============================================
// FUNCIÓN HELPER - GENERAR CÓDIGO
// ============================================

export async function generarSiguienteCodigoCotizacion(): Promise<string> {
  try {
    const cotizaciones = await getAllCotizaciones()
    
    if (cotizaciones.length === 0) {
      return 'COT-001'
    }
    
    // Extraer números de los códigos
    const numeros = cotizaciones
      .map(c => {
        const match = c.codigo.match(/COT-(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(n => !isNaN(n))
    
    const maxNumero = Math.max(...numeros, 0)
    const siguiente = maxNumero + 1
    
    return `COT-${siguiente.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generando código de cotización:', error)
    return 'COT-001'
  }
}

