import { getSupabaseServer } from './supabaseServer'
import { normalizeText } from './utils'

const supabase = getSupabaseServer()

// Interfaz para el lead en Supabase (alineada con el esquema real)
export interface LeadSupabase {
  id: string
  nombre: string
  empresa?: string | null
  email?: string | null
  telefono?: string | null
  ciudad?: string | null
  sector?: string | null
  interes?: string | null
  origen?: string | null
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

// Interfaz para el lead en el frontend
export interface Lead {
  id: string
  nombre: string
  empresa?: string
  email?: string
  telefono?: string
  ciudad?: string
  sector?: string
  interes?: string
  origen?: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

/**
 * Convertir lead de Supabase al formato esperado por el frontend
 */
export function supabaseToLead(record: LeadSupabase): Lead {
  return {
    id: record.id,
    nombre: record.nombre || '',
    empresa: record.empresa || undefined,
    email: record.email || undefined,
    telefono: record.telefono || undefined,
    ciudad: record.ciudad || undefined,
    sector: record.sector || undefined,
    interes: record.interes || undefined,
    origen: record.origen || undefined,
    deleted_at: record.deleted_at || undefined,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString()
  }
}

/**
 * Convertir del formato frontend a Supabase
 */
export function leadToSupabase(lead: Partial<Lead>): Partial<LeadSupabase> {
  const supabaseData: Partial<LeadSupabase> = {}

  // Campo requerido: nombre
  if (lead.nombre !== undefined) {
    supabaseData.nombre = lead.nombre.trim()
  }

  // Campos opcionales
  if (lead.empresa !== undefined) {
    supabaseData.empresa = lead.empresa?.trim() || null
  }
  
  if (lead.email !== undefined) {
    supabaseData.email = lead.email?.trim() || null
  }
  
  if (lead.telefono !== undefined) {
    supabaseData.telefono = lead.telefono?.trim() || null
  }
  
  if (lead.ciudad !== undefined) {
    supabaseData.ciudad = lead.ciudad?.trim() || null
  }
  
  if (lead.sector !== undefined) {
    supabaseData.sector = lead.sector?.trim() || null
  }
  
  if (lead.interes !== undefined) {
    supabaseData.interes = lead.interes?.trim() || null
  }
  
  if (lead.origen !== undefined) {
    supabaseData.origen = lead.origen?.trim() || null
  }

  return supabaseData
}

/**
 * Obtener todos los leads con filtros opcionales
 */
export async function getAllLeads(options?: {
  query?: string
  sector?: string
  interes?: string
  origen?: string
  page?: number
  limit?: number
  includeDeleted?: boolean
}): Promise<{ data: Lead[], total: number }> {
  try {
    let queryBuilder = supabase
      .from('leads')
      .select('*', { count: 'exact' })

    // Por defecto, excluir leads eliminados (deleted_at IS NULL)
    // Si includeDeleted es true, solo mostrar los eliminados (deleted_at IS NOT NULL)
    if (options?.includeDeleted) {
      queryBuilder = queryBuilder.not('deleted_at', 'is', null)
    } else {
      queryBuilder = queryBuilder.is('deleted_at', null)
    }

    // Aplicar filtros de búsqueda
    if (options?.query && options.query.trim()) {
      const searchTerm = options.query.trim()
      queryBuilder = queryBuilder.or(
        `nombre.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`
      )
    }

    // Filtro por sector
    if (options?.sector && options.sector !== 'ALL') {
      queryBuilder = queryBuilder.eq('sector', options.sector)
    }

    // Filtro por interes
    if (options?.interes && options.interes !== 'ALL') {
      queryBuilder = queryBuilder.eq('interes', options.interes)
    }

    // Filtro por origen
    if (options?.origen && options.origen !== 'ALL') {
      queryBuilder = queryBuilder.eq('origen', options.origen)
    }

    // Ordenar por created_at desc por defecto
    queryBuilder = queryBuilder.order('created_at', { ascending: false })

    // Aplicar paginación si se especifica
    if (options?.page && options?.limit) {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1
      queryBuilder = queryBuilder.range(from, to)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error('❌ [Supabase] Error getting leads:', error)
      return { data: [], total: 0 }
    }

    return {
      data: data?.map((record: LeadSupabase) => supabaseToLead(record)) || [],
      total: count || 0
    }
  } catch (error) {
    console.error('❌ Error en getAllLeads:', error)
    return { data: [], total: 0 }
  }
}

/**
 * Buscar lead por ID
 */
export async function findLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding lead:', error)
    return null
  }

  if (!data) {
    return null
  }

  return supabaseToLead(data as LeadSupabase)
}

/**
 * Crear nuevo lead
 */
export async function createLead(leadData: Partial<Lead>): Promise<Lead> {
  const now = new Date().toISOString()

  // Validar campo requerido: nombre
  if (!leadData.nombre || leadData.nombre.trim() === '') {
    throw new Error('El nombre es requerido')
  }

  // Convertir datos del frontend al formato de Supabase
  const supabaseData = leadToSupabase(leadData)
  
  // Validar que el nombre se mapeó correctamente
  if (!supabaseData.nombre || supabaseData.nombre.trim() === '') {
    throw new Error('El nombre es requerido')
  }

  // Preparar datos para insertar
  const insertData: any = {
    nombre: supabaseData.nombre,
    created_at: now,
    updated_at: now
  }

  // Agregar campos opcionales solo si tienen valor
  if (supabaseData.empresa !== undefined) insertData.empresa = supabaseData.empresa
  if (supabaseData.email !== undefined) insertData.email = supabaseData.email
  if (supabaseData.telefono !== undefined) insertData.telefono = supabaseData.telefono
  if (supabaseData.ciudad !== undefined) insertData.ciudad = supabaseData.ciudad
  if (supabaseData.sector !== undefined) insertData.sector = supabaseData.sector
  if (supabaseData.interes !== undefined) insertData.interes = supabaseData.interes
  if (supabaseData.origen !== undefined) insertData.origen = supabaseData.origen

  console.log('📋 Insertando lead en Supabase:', {
    nombre: insertData.nombre,
    campos_opcionales: Object.keys(insertData).filter(k => !['nombre', 'created_at', 'updated_at'].includes(k))
  })

  const { data, error } = await supabase
    .from('leads')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando lead en Supabase:')
    console.error('   Code:', error.code)
    console.error('   Message:', error.message)
    console.error('   Details:', error.details)
    console.error('   Hint:', error.hint)
    throw new Error(`Error al crear lead: ${error.message}${error.details ? ` (${error.details})` : ''}`)
  }

  if (!data) {
    throw new Error('No se recibieron datos después de crear el lead')
  }

  console.log('✅ Lead creado exitosamente - ID:', data.id, 'Nombre:', data.nombre)
  return supabaseToLead(data as LeadSupabase)
}

/**
 * Actualizar lead
 */
export async function updateLead(
  id: string,
  updates: Partial<Lead>
): Promise<Lead | null> {
  // Convertir updates del frontend al formato de Supabase
  const supabaseUpdates = leadToSupabase(updates)
  
  // Construir updateData
  const updateData: any = {
    ...supabaseUpdates,
    updated_at: new Date().toISOString()
  }

  // Eliminar cualquier campo que no exista en la tabla (por seguridad)
  const validColumns = [
    'nombre', 'empresa', 'email', 'telefono', 'ciudad', 'sector', 'interes', 'origen',
    'created_at', 'updated_at'
  ]
  
  Object.keys(updateData).forEach(key => {
    if (!validColumns.includes(key)) {
      delete updateData[key]
    }
  })

  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating lead:', { id, error: error.message, code: error.code })
    return null
  }

  // Si no hay data, el lead no existe o no se actualizó
  if (!data) {
    return null
  }

  return supabaseToLead(data as LeadSupabase)
}

/**
 * Eliminar lead
 */
export async function deleteLead(id: string): Promise<boolean> {
  // Verificar que existe el lead
  const lead = await findLeadById(id)
  
  if (!lead) {
    return false
  }

  const { error, count } = await supabase
    .from('leads')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    console.error('❌ Error deleting lead:', error)
    return false
  }

  // Verificar que realmente se eliminó algo
  return count !== null && count > 0
}

/**
 * Obtener todos los IDs de leads (con filtros)
 */
export async function getAllLeadsIds(options?: {
  query?: string
  sector?: string
  interes?: string
  origen?: string
  includeDeleted?: boolean
}): Promise<string[]> {
  let queryBuilder = supabase
    .from('leads')
    .select('id')

  // Por defecto, excluir leads eliminados
  if (!options?.includeDeleted) {
    queryBuilder = queryBuilder.is('deleted_at', null)
  }

  // Aplicar filtros de búsqueda
  if (options?.query && options.query.trim()) {
    const searchTerm = options.query.trim()
    queryBuilder = queryBuilder.or(
      `nombre.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`
    )
  }

  // Filtro por sector
  if (options?.sector && options.sector !== 'ALL') {
    queryBuilder = queryBuilder.eq('sector', options.sector)
  }

  // Filtro por interes
  if (options?.interes && options.interes !== 'ALL') {
    queryBuilder = queryBuilder.eq('interes', options.interes)
  }

  // Filtro por origen
  if (options?.origen && options.origen !== 'ALL') {
    queryBuilder = queryBuilder.eq('origen', options.origen)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('❌ Error getting leads IDs:', error)
    return []
  }

  return data?.map((record: any) => record.id) || []
}

/**
 * Obtener valores únicos de un campo específico de toda la base de datos
 */
export async function getUniqueFieldValues(field: 'sector' | 'interes' | 'origen'): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(field)
      .not(field, 'is', null)

    if (error) {
      console.error(`❌ Error getting unique ${field} values:`, error)
      return []
    }

    // Obtener valores únicos y ordenarlos
    const uniqueValues = new Set<string>()
    data?.forEach((record: any) => {
      if (record[field]) {
        uniqueValues.add(record[field])
      }
    })

    return Array.from(uniqueValues).sort()
  } catch (error) {
    console.error(`❌ Error en getUniqueFieldValues(${field}):`, error)
    return []
  }
}

/**
 * Matar leads (marcar como eliminados con deleted_at)
 */
export async function killLeads(leadIds: string[]): Promise<number> {
  try {
    const now = new Date().toISOString()
    const { error, count } = await supabase
      .from('leads')
      .update({ deleted_at: now, updated_at: now })
      .in('id', leadIds)
      .is('deleted_at', null) // Solo actualizar si no están ya eliminados

    if (error) {
      console.error('❌ Error killing leads:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('❌ Error en killLeads:', error)
    return 0
  }
}

/**
 * Restaurar leads (quitar deleted_at)
 */
export async function restoreLeads(leadIds: string[]): Promise<number> {
  try {
    const now = new Date().toISOString()
    const { error, count } = await supabase
      .from('leads')
      .update({ deleted_at: null, updated_at: now })
      .in('id', leadIds)
      .not('deleted_at', 'is', null) // Solo actualizar si están eliminados

    if (error) {
      console.error('❌ Error restoring leads:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('❌ Error en restoreLeads:', error)
    return 0
  }
}

