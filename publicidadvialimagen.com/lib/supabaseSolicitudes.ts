import { getSupabaseServer } from './supabaseServer'

// Lazy initialization para evitar dependencias circulares
function getSupabase() {
  return getSupabaseServer()
}

// Interfaz para la solicitud en Supabase
// NOTA: La tabla en Supabase debe tener estos campos:
// id, codigo, estado, fecha_inicio, meses_alquiler, soporte, servicios_adicionales, 
// empresa, contacto, telefono, email, comentarios, created_at, updated_at
export interface SolicitudSupabase {
  id: string
  codigo: string
  estado: 'Nueva' | 'Pendiente' | 'Cotizada'
  fecha_inicio: string
  meses_alquiler: number
  soporte: string
  servicios_adicionales?: string[] | null
  empresa?: string
  contacto?: string
  telefono?: string
  email?: string
  comentarios?: string
  created_at?: string
  updated_at?: string
}

// Interfaz para la solicitud en el frontend (compatible con Airtable)
export interface Solicitud {
  id?: string
  codigo: string
  fechaCreacion: string
  empresa: string
  contacto: string
  telefono: string
  email: string
  comentarios: string
  estado: 'Nueva' | 'Pendiente' | 'Cotizada'
  fechaInicio: string
  mesesAlquiler: number
  soporte: string
  serviciosAdicionales: string[]
}

/**
 * Convertir solicitud de Supabase al formato esperado por el frontend (compatible con Airtable)
 */
function supabaseToSolicitud(record: SolicitudSupabase): Solicitud {
  // Formatear fecha de creación
  const fechaCreacion = record.created_at 
    ? new Date(record.created_at).toLocaleString('es-BO')
    : new Date().toLocaleString('es-BO')

  return {
    id: record.id,
    codigo: record.codigo,
    fechaCreacion,
    empresa: record.empresa || '',
    contacto: record.contacto || '',
    telefono: record.telefono || '',
    email: record.email || '',
    comentarios: record.comentarios || '',
    estado: record.estado || 'Nueva',
    fechaInicio: record.fecha_inicio,
    mesesAlquiler: record.meses_alquiler,
    soporte: record.soporte,
    serviciosAdicionales: Array.isArray(record.servicios_adicionales) 
      ? record.servicios_adicionales 
      : (record.servicios_adicionales ? [record.servicios_adicionales] : [])
  }
}

/**
 * Obtener todas las solicitudes
 */
export async function getAllSolicitudes(): Promise<Solicitud[]> {
  const { data, error } = await getSupabase()
    .from('solicitudes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ [Supabase] Error getting solicitudes:', error)
    return []
  }

  if (!data) {
    return []
  }

  return data.map((record: SolicitudSupabase) => supabaseToSolicitud(record))
}

/**
 * Buscar solicitud por código o ID
 */
export async function findSolicitudByCodigoOrId(codigoOrId: string): Promise<Solicitud | null> {
  console.log('🔍 Buscando solicitud por código o ID:', codigoOrId)
  
  // Primero intentar buscar por código
  let query = getSupabase()
    .from('solicitudes')
    .select('*')
    .eq('codigo', codigoOrId)
    .limit(1)
    .maybeSingle()
  
  let { data, error } = await query

  // Si no encontró por código, intentar por ID (si parece un UUID)
  if (!data && !error) {
    console.log('⚠️ No encontrado por código, intentando por ID...')
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codigoOrId)
    
    if (isUUID) {
      query = getSupabase()
        .from('solicitudes')
        .select('*')
        .eq('id', codigoOrId)
        .limit(1)
        .maybeSingle()
      
      const result = await query
      data = result.data
      error = result.error
    }
  }

  if (error) {
    console.error('❌ [Supabase] Error finding solicitud:', error)
    return null
  }

  if (!data) {
    console.log('⚠️ Solicitud no encontrada:', codigoOrId)
    return null
  }

  console.log('✅ Solicitud encontrada:', data.codigo, 'ID:', data.id)
  return supabaseToSolicitud(data as SolicitudSupabase)
}

/**
 * Buscar solicitud por código
 */
export async function findSolicitudByCodigo(codigo: string): Promise<Solicitud | null> {
  const { data, error } = await getSupabase()
    .from('solicitudes')
    .select('*')
    .eq('codigo', codigo)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding solicitud by codigo:', error)
    return null
  }

  if (!data) {
    return null
  }

  return supabaseToSolicitud(data as SolicitudSupabase)
}

/**
 * Obtener el siguiente código de solicitud consecutivo
 */
export async function generarSiguienteCodigo(): Promise<string> {
  try {
    const { data, error } = await getSupabase()
      .from('solicitudes')
      .select('codigo')
      .like('codigo', 'SC-%')
      .order('codigo', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Error obteniendo códigos existentes:', error)
      return 'SC-001'
    }

    // Filtrar códigos que empiecen con "SC-" y extraer números
    const codigosSC = (data || [])
      .map((record: any) => record.codigo)
      .filter((codigo: string) => codigo && codigo.startsWith('SC-'))
      .map((codigo: string) => {
        const match = codigo.match(/^SC-(\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter((numero: number) => numero > 0)

    // Encontrar el siguiente número disponible
    const siguienteNumero = codigosSC.length > 0 ? Math.max(...codigosSC) + 1 : 1

    // Formatear con 3 dígitos
    const numeroFormateado = siguienteNumero.toString().padStart(3, '0')

    return `SC-${numeroFormateado}`
  } catch (error) {
    console.error('❌ Error obteniendo códigos existentes:', error)
    return 'SC-001'
  }
}

/**
 * Crear nueva solicitud
 */
export async function createSolicitud(
  codigo: string,
  estado: 'Nueva' | 'Pendiente' | 'Cotizada',
  fechaInicio: string,
  mesesAlquiler: number,
  soporte: string,
  serviciosAdicionales: string[] = [],
  empresa?: string,
  contacto?: string,
  telefono?: string,
  email?: string,
  comentarios?: string
): Promise<Solicitud> {
  const now = new Date().toISOString()

  // Normalizar el estado para asegurar que coincida con la constraint
  const estadoNormalizado = estado.trim() as 'Nueva' | 'Pendiente' | 'Cotizada'
  
  // Validar que el estado sea uno de los valores permitidos
  const estadosPermitidos = ['Nueva', 'Pendiente', 'Cotizada']
  if (!estadosPermitidos.includes(estadoNormalizado)) {
    throw new Error(`Estado inválido: ${estado}. Debe ser uno de: ${estadosPermitidos.join(', ')}`)
  }

  const solicitudData: any = {
    codigo,
    estado: estadoNormalizado,
    fecha_inicio: fechaInicio,
    meses_alquiler: mesesAlquiler,
    soporte,
    servicios_adicionales: serviciosAdicionales.length > 0 ? serviciosAdicionales : null,
    created_at: now,
    updated_at: now
  }

  // Agregar campos opcionales si existen
  if (empresa) solicitudData.empresa = empresa
  if (contacto) solicitudData.contacto = contacto
  if (telefono) solicitudData.telefono = telefono
  if (email) solicitudData.email = email
  if (comentarios) solicitudData.comentarios = comentarios

  console.log('📋 Datos a insertar en Supabase:', JSON.stringify(solicitudData, null, 2))
  console.log('🔍 Estado normalizado:', estadoNormalizado, 'tipo:', typeof estadoNormalizado)

  const { data, error } = await getSupabase()
    .from('solicitudes')
    .insert([solicitudData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating solicitud:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    console.error('   Error details:', error.details)
    console.error('   Error hint:', error.hint)
    console.error('   Datos enviados:', JSON.stringify(solicitudData, null, 2))
    throw new Error(`Error creating solicitud: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned after creating solicitud')
  }

  return supabaseToSolicitud(data as SolicitudSupabase)
}

/**
 * Actualizar solicitud
 */
export async function updateSolicitud(
  codigoOrId: string,
  updates: {
    estado?: 'Nueva' | 'Pendiente' | 'Cotizada'
    fecha_inicio?: string
    meses_alquiler?: number
    soporte?: string
    servicios_adicionales?: string[]
    empresa?: string
    contacto?: string
    telefono?: string
    email?: string
    comentarios?: string
  }
): Promise<Solicitud | null> {
  // Primero encontrar la solicitud para obtener su ID
  const solicitud = await findSolicitudByCodigoOrId(codigoOrId)
  
  if (!solicitud || !solicitud.id) {
    console.log('⚠️ Solicitud no encontrada para actualizar:', codigoOrId)
    return null
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.estado !== undefined) updateData.estado = updates.estado
  if (updates.fecha_inicio !== undefined) updateData.fecha_inicio = updates.fecha_inicio
  if (updates.meses_alquiler !== undefined) updateData.meses_alquiler = updates.meses_alquiler
  if (updates.soporte !== undefined) updateData.soporte = updates.soporte
  if (updates.servicios_adicionales !== undefined) {
    updateData.servicios_adicionales = updates.servicios_adicionales.length > 0 
      ? updates.servicios_adicionales 
      : null
  }
  if (updates.empresa !== undefined) updateData.empresa = updates.empresa
  if (updates.contacto !== undefined) updateData.contacto = updates.contacto
  if (updates.telefono !== undefined) updateData.telefono = updates.telefono
  if (updates.email !== undefined) updateData.email = updates.email
  if (updates.comentarios !== undefined) updateData.comentarios = updates.comentarios

  // Actualizar usando el ID
  const { data, error } = await getSupabase()
    .from('solicitudes')
    .update(updateData)
    .eq('id', solicitud.id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating solicitud:', error)
    return null
  }

  if (!data) return null

  return supabaseToSolicitud(data as SolicitudSupabase)
}

/**
 * Eliminar solicitud
 */
export async function deleteSolicitud(codigoOrId: string): Promise<boolean> {
  // Primero verificar que existe la solicitud
  const solicitud = await findSolicitudByCodigoOrId(codigoOrId)
  
  if (!solicitud) {
    console.log('⚠️ Solicitud no encontrada para eliminar:', codigoOrId)
    return false
  }

  // Eliminar usando el ID (más eficiente que usar código)
  const idToDelete = solicitud.id || codigoOrId
  
  const { error, count } = await getSupabase()
    .from('solicitudes')
    .delete({ count: 'exact' })
    .eq('id', idToDelete)

  if (error) {
    console.error('❌ Error deleting solicitud:', error)
    return false
  }

  // Verificar que realmente se eliminó algo
  if (count === 0) {
    console.log('⚠️ No se eliminó ninguna solicitud (count = 0):', codigoOrId)
    return false
  }

  console.log('✅ Solicitud eliminada correctamente:', codigoOrId, 'count:', count)
  return true
}

/**
 * Actualizar múltiples solicitudes (bulk update)
 */
export async function updateMultipleSolicitudes(
  codigos: string[],
  updates: {
    estado?: 'Nueva' | 'Pendiente' | 'Cotizada'
  }
): Promise<number> {
  if (!codigos || codigos.length === 0) {
    return 0
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.estado !== undefined) {
    updateData.estado = updates.estado
  }

  // Actualizar usando el operador in para múltiples códigos
  const { data, error } = await getSupabase()
    .from('solicitudes')
    .update(updateData)
    .in('codigo', codigos)
    .select()

  if (error) {
    console.error('❌ Error updating multiple solicitudes:', error)
    return 0
  }

  return data?.length || 0
}

