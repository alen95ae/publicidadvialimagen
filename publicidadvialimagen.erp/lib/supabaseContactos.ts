import { getSupabaseServer } from './supabaseServer'

const supabase = getSupabaseServer()

// Interfaz para el contacto en Supabase
export interface ContactoSupabase {
  id: string
  nombre: string
  tipo_contacto: 'Individual' | 'Compañía'
  empresa?: string | null
  relacion: 'Cliente' | 'Proveedor' | 'Ambos'
  email?: string | null
  telefono?: string | null
  nit?: string | null
  direccion?: string | null
  ciudad?: string | null
  codigo_postal?: string | null
  pais?: string | null
  sitio_web?: string | null
  notas?: string | null
  fecha_creacion?: string
  fecha_actualizacion?: string
  created_at?: string
  updated_at?: string
}

// Interfaz para el contacto en el frontend (compatible con estructura actual)
export interface Contacto {
  id: string
  displayName: string
  legalName: string
  company: string
  kind: 'INDIVIDUAL' | 'COMPANY'
  email: string
  phone: string
  taxId: string
  address: string
  city: string
  postalCode: string
  country: string
  relation: string
  website: string
  status: string
  notes: string
  createdAt: string
  updatedAt: string
}

/**
 * Convertir contacto de Supabase al formato esperado por el frontend
 */
function supabaseToContacto(record: ContactoSupabase): Contacto {
  return {
    id: record.id,
    displayName: record.nombre || '',
    legalName: record.empresa || '',
    company: record.empresa || '',
    kind: record.tipo_contacto === 'Individual' ? 'INDIVIDUAL' : 'COMPANY',
    email: record.email || '',
    phone: record.telefono || '',
    taxId: record.nit || '',
    address: record.direccion || '',
    city: record.ciudad || '',
    postalCode: record.codigo_postal || '',
    country: record.pais || 'Bolivia',
    relation: record.relacion || 'Cliente',
    website: record.sitio_web || '',
    status: 'activo',
    notes: record.notas || '',
    createdAt: record.created_at || record.fecha_creacion || new Date().toISOString(),
    updatedAt: record.updated_at || record.fecha_actualizacion || new Date().toISOString()
  }
}

/**
 * Convertir del formato frontend a Supabase
 */
function contactoToSupabase(contacto: Partial<Contacto>): Partial<ContactoSupabase> {
  const supabaseData: Partial<ContactoSupabase> = {}

  if (contacto.displayName !== undefined) supabaseData.nombre = contacto.displayName
  if (contacto.kind !== undefined) {
    supabaseData.tipo_contacto = contacto.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
  }
  if (contacto.legalName !== undefined) supabaseData.empresa = contacto.legalName || null
  if (contacto.company !== undefined) supabaseData.empresa = contacto.company || null
  if (contacto.email !== undefined) supabaseData.email = contacto.email || null
  if (contacto.phone !== undefined) supabaseData.telefono = contacto.phone || null
  if (contacto.taxId !== undefined) supabaseData.nit = contacto.taxId || null
  if (contacto.address !== undefined) supabaseData.direccion = contacto.address || null
  if (contacto.city !== undefined) supabaseData.ciudad = contacto.city || null
  if (contacto.postalCode !== undefined) supabaseData.codigo_postal = contacto.postalCode || null
  if (contacto.country !== undefined) supabaseData.pais = contacto.country || null
  if (contacto.website !== undefined) supabaseData.sitio_web = contacto.website || null
  if (contacto.notes !== undefined) supabaseData.notas = contacto.notes || null
  
  // Mapear la relación
  if (contacto.relation !== undefined) {
    const relationMap: { [key: string]: 'Cliente' | 'Proveedor' | 'Ambos' } = {
      'CUSTOMER': 'Cliente',
      'SUPPLIER': 'Proveedor',
      'BOTH': 'Ambos',
      'Cliente': 'Cliente',
      'Proveedor': 'Proveedor',
      'Ambos': 'Ambos'
    }
    supabaseData.relacion = relationMap[contacto.relation] || 'Cliente'
  }

  return supabaseData
}

/**
 * Obtener todos los contactos con filtros opcionales
 */
export async function getAllContactos(options?: {
  query?: string
  relation?: string
  kind?: string
  page?: number
  limit?: number
}): Promise<Contacto[]> {
  try {
    // Si hay paginación específica, usar un solo query
    if (options?.page && options?.limit) {
      let queryBuilder = supabase
        .from('contactos')
        .select('*')
        .order('nombre', { ascending: true })

      // Aplicar filtros
      if (options?.query && options.query.trim()) {
        const searchTerm = options.query.trim().toLowerCase()
        queryBuilder = queryBuilder.or(
          `nombre.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
      }

      if (options?.relation && options.relation !== 'ALL') {
        const relations = options.relation.split(',').map(r => r.trim())
        if (relations.length === 1) {
          queryBuilder = queryBuilder.eq('relacion', relations[0])
        } else {
          queryBuilder = queryBuilder.in('relacion', relations)
        }
      }

      if (options?.kind && options.kind !== 'ALL') {
        const tipoContacto = options.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
        queryBuilder = queryBuilder.eq('tipo_contacto', tipoContacto)
      }

      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1
      queryBuilder = queryBuilder.range(from, to)

      const { data, error } = await queryBuilder

      if (error) {
        console.error('❌ [Supabase] Error getting contactos:', error)
        return []
      }

      return data?.map((record: ContactoSupabase) => supabaseToContacto(record)) || []
    }

    // Si NO hay paginación, obtener TODOS los registros usando paginación automática
    console.log('📊 Obteniendo TODOS los contactos de Supabase...')
    
    const allContactos: ContactoSupabase[] = []
    let from = 0
    const batchSize = 1000 // Tamaño de lote para cada petición
    let hasMore = true

    while (hasMore) {
      let queryBuilder = supabase
        .from('contactos')
        .select('*')
        .order('nombre', { ascending: true })
        .range(from, from + batchSize - 1)

      // Aplicar filtros
      if (options?.query && options.query.trim()) {
        const searchTerm = options.query.trim().toLowerCase()
        queryBuilder = queryBuilder.or(
          `nombre.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
      }

      if (options?.relation && options.relation !== 'ALL') {
        const relations = options.relation.split(',').map(r => r.trim())
        if (relations.length === 1) {
          queryBuilder = queryBuilder.eq('relacion', relations[0])
        } else {
          queryBuilder = queryBuilder.in('relacion', relations)
        }
      }

      if (options?.kind && options.kind !== 'ALL') {
        const tipoContacto = options.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
        queryBuilder = queryBuilder.eq('tipo_contacto', tipoContacto)
      }

      const { data, error } = await queryBuilder

      if (error) {
        console.error('❌ [Supabase] Error getting contactos batch:', error)
        break
      }

      if (!data || data.length === 0) {
        hasMore = false
        break
      }

      allContactos.push(...data)
      console.log(`📊 Obtenidos ${allContactos.length} contactos...`)

      // Si obtuvimos menos registros que el tamaño del lote, ya no hay más
      if (data.length < batchSize) {
        hasMore = false
      } else {
        from += batchSize
      }
    }

    console.log(`✅ Total de contactos obtenidos: ${allContactos.length}`)
    return allContactos.map((record: ContactoSupabase) => supabaseToContacto(record))
  } catch (error) {
    console.error('❌ Error en getAllContactos:', error)
    return []
  }
}

/**
 * Buscar contacto por ID
 */
export async function findContactoById(id: string): Promise<Contacto | null> {
  console.log('🔍 Buscando contacto por ID:', id)

  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding contacto:', error)
    return null
  }

  if (!data) {
    console.log('⚠️ Contacto no encontrado:', id)
    return null
  }

  console.log('✅ Contacto encontrado:', data.nombre, 'ID:', data.id)
  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Crear nuevo contacto
 */
export async function createContacto(contactoData: Partial<Contacto>): Promise<Contacto> {
  const now = new Date().toISOString()

  // Validar campos requeridos
  if (!contactoData.displayName || contactoData.displayName.trim() === '') {
    throw new Error('El nombre es requerido')
  }

  const supabaseData = contactoToSupabase(contactoData)
  
  // Asegurar que tiene nombre
  if (!supabaseData.nombre) {
    throw new Error('El nombre es requerido')
  }

  // Valores por defecto
  if (!supabaseData.tipo_contacto) {
    supabaseData.tipo_contacto = 'Individual'
  }
  if (!supabaseData.relacion) {
    supabaseData.relacion = 'Cliente'
  }
  if (!supabaseData.pais) {
    supabaseData.pais = 'Bolivia'
  }

  const insertData = {
    ...supabaseData,
    fecha_creacion: now,
    fecha_actualizacion: now,
    created_at: now,
    updated_at: now
  }

  console.log('📋 Datos a insertar en Supabase:', JSON.stringify(insertData, null, 2))

  const { data, error } = await supabase
    .from('contactos')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating contacto:', error)
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    console.error('   Error details:', error.details)
    throw new Error(`Error creating contacto: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned after creating contacto')
  }

  console.log('✅ Contacto creado exitosamente:', data.id)
  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Actualizar contacto
 */
export async function updateContacto(
  id: string,
  updates: Partial<Contacto>
): Promise<Contacto | null> {
  // Primero verificar que existe el contacto
  const contactoExistente = await findContactoById(id)
  
  if (!contactoExistente) {
    console.log('⚠️ Contacto no encontrado para actualizar:', id)
    return null
  }

  const supabaseUpdates = contactoToSupabase(updates)
  
  const updateData: any = {
    ...supabaseUpdates,
    fecha_actualizacion: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('📝 Actualizando contacto:', id, updateData)

  const { data, error } = await supabase
    .from('contactos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating contacto:', error)
    return null
  }

  if (!data) return null

  console.log('✅ Contacto actualizado exitosamente:', id)
  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Eliminar contacto
 */
export async function deleteContacto(id: string): Promise<boolean> {
  // Primero verificar que existe el contacto
  const contacto = await findContactoById(id)
  
  if (!contacto) {
    console.log('⚠️ Contacto no encontrado para eliminar:', id)
    return false
  }

  const { error, count } = await supabase
    .from('contactos')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    console.error('❌ Error deleting contacto:', error)
    return false
  }

  // Verificar que realmente se eliminó algo
  if (count === 0) {
    console.log('⚠️ No se eliminó ningún contacto (count = 0):', id)
    return false
  }

  console.log('✅ Contacto eliminado correctamente:', id, 'count:', count)
  return true
}

/**
 * Obtener todos los IDs de contactos
 */
export async function getAllContactosIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('contactos')
    .select('id')

  if (error) {
    console.error('❌ Error getting contactos IDs:', error)
    return []
  }

  return data?.map((record: any) => record.id) || []
}

/**
 * Buscar contactos duplicados por email
 */
export async function findDuplicateContactosByEmail(email: string): Promise<Contacto[]> {
  if (!email || email.trim() === '') {
    return []
  }

  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .eq('email', email.trim().toLowerCase())

  if (error) {
    console.error('❌ Error finding duplicate contactos:', error)
    return []
  }

  return data?.map((record: ContactoSupabase) => supabaseToContacto(record)) || []
}

/**
 * Eliminar múltiples contactos por email
 */
export async function deleteContactosByEmails(emails: string[]): Promise<number> {
  if (!emails || emails.length === 0) {
    return 0
  }

  const { data, error } = await supabase
    .from('contactos')
    .delete()
    .in('email', emails)
    .select()

  if (error) {
    console.error('❌ Error deleting contactos by emails:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Fusionar contactos (merge)
 */
export async function mergeContactos(
  targetId: string,
  sourceIds: string[]
): Promise<Contacto | null> {
  // Obtener el contacto destino
  const targetContacto = await findContactoById(targetId)
  
  if (!targetContacto) {
    console.log('⚠️ Contacto destino no encontrado:', targetId)
    return null
  }

  // Eliminar los contactos fuente
  const { error } = await supabase
    .from('contactos')
    .delete()
    .in('id', sourceIds)

  if (error) {
    console.error('❌ Error merging contactos:', error)
    return null
  }

  console.log('✅ Contactos fusionados exitosamente')
  return targetContacto
}

