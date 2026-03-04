import { getSupabaseServer } from './supabaseServer'
import { normalizeText } from './utils'

const supabase = getSupabaseServer()

// Interfaz para el contacto en Supabase (alineada con el esquema real)
export interface ContactoSupabase {
  id: string
  nombre: string
  tipo_contacto: 'Individual' | 'Compañía'
  empresa?: string | null
  company_id?: string | null // ID del contacto empresa (para Individual)
  razon_social?: string | null
  persona_contacto?: any | null // JSONB: Array<{ id: string; nombre: string }>
  relacion: string[] // jsonb array: ["Cliente"], ["Proveedor"], ["Cliente","Proveedor"], []
  email?: string | null
  telefono?: string | null
  nit?: string | null
  direccion?: string | null
  ciudad?: string | null
  pais?: string | null
  sitio_web?: string | null
  notas?: string | null
  comercial?: string | null
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
  companyId?: string // ID del contacto empresa (para Individual)
  razonSocial?: string
  personaContacto?: Array<{ id: string; nombre: string }> // Array de personas de contacto (para Compañía)
  kind: 'INDIVIDUAL' | 'COMPANY'
  email: string
  phone: string
  taxId: string
  address: string
  city: string
  postalCode: string
  country: string
  relation: string[] // array de "Cliente" | "Proveedor"
  website: string
  status: string
  notes: string
  salesOwnerId?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Convertir contacto de Supabase al formato esperado por el frontend
 */
export function supabaseToContacto(record: ContactoSupabase): Contacto {
  // Parsear persona_contacto desde JSON si existe
  let personaContacto: Array<{ id: string; nombre: string }> | undefined = undefined
  if (record.persona_contacto) {
    try {
      if (typeof record.persona_contacto === 'string') {
        personaContacto = JSON.parse(record.persona_contacto)
      } else if (Array.isArray(record.persona_contacto)) {
        personaContacto = record.persona_contacto
      }
    } catch (e) {
      console.error('Error parseando persona_contacto:', e)
    }
  }

  // Normalizar relacion: BD ahora es jsonb array; soportar legacy string
  let relationArr: string[] = []
  if (Array.isArray(record.relacion)) {
    relationArr = record.relacion.filter((r): r is string => r === 'Cliente' || r === 'Proveedor')
  } else if (typeof record.relacion === 'string') {
    const v = (record.relacion || 'Cliente').trim()
    if (v === 'Ambos') relationArr = ['Cliente', 'Proveedor']
    else if (v === 'Proveedor') relationArr = ['Proveedor']
    else relationArr = ['Cliente']
  }

  return {
    id: record.id,
    displayName: record.nombre || '',
    legalName: record.empresa || '',
    company: record.empresa || '',
    companyId: record.company_id || '',
    razonSocial: record.razon_social || '',
    personaContacto: personaContacto,
    kind: record.tipo_contacto === 'Individual' ? 'INDIVIDUAL' : 'COMPANY',
    email: record.email || '',
    phone: record.telefono || '',
    taxId: record.nit || '',
    address: record.direccion || '',
    city: record.ciudad || '',
    postalCode: '',
    country: record.pais || 'Bolivia',
    relation: relationArr,
    website: record.sitio_web || '',
    status: 'activo',
    notes: record.notas || '',
    salesOwnerId: record.comercial || null,
    createdAt: record.created_at || record.fecha_creacion || new Date().toISOString(),
    updatedAt: record.updated_at || record.fecha_actualizacion || new Date().toISOString()
  }
}

/**
 * Convertir del formato frontend a Supabase
 * Mapea correctamente todos los campos según la estructura real de la tabla
 */
export function contactoToSupabase(contacto: Partial<Contacto>): Partial<ContactoSupabase> {
  const supabaseData: Partial<ContactoSupabase> = {}

  // Campo requerido: nombre
  if (contacto.displayName !== undefined) {
    supabaseData.nombre = contacto.displayName.trim()
  }

  // Campo requerido: tipo_contacto (con valor por defecto)
  if (contacto.kind !== undefined) {
    supabaseData.tipo_contacto = contacto.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
  }

  // relacion: array de strings (jsonb)
  if (contacto.relation !== undefined) {
    const arr = Array.isArray(contacto.relation)
      ? contacto.relation.filter((r) => r === 'Cliente' || r === 'Proveedor')
      : []
    supabaseData.relacion = [...new Set(arr)]
  }

  // Campos opcionales (nullable)
  if (contacto.company !== undefined) {
    supabaseData.empresa = contacto.company?.trim() || null
  }

  // company_id: ID del contacto empresa (para Individual)
  if (contacto.companyId !== undefined) {
    supabaseData.company_id = contacto.companyId?.trim() || null
  }
  
  if (contacto.razonSocial !== undefined) {
    supabaseData.razon_social = contacto.razonSocial?.trim() || null
  }

  // persona_contacto: guardar como JSONB (array de objetos)
  if (contacto.personaContacto !== undefined) {
    if (Array.isArray(contacto.personaContacto) && contacto.personaContacto.length > 0) {
      supabaseData.persona_contacto = contacto.personaContacto
    } else {
      supabaseData.persona_contacto = null
    }
  }
  
  if (contacto.email !== undefined) {
    supabaseData.email = contacto.email?.trim() || null
  }
  
  if (contacto.phone !== undefined) {
    supabaseData.telefono = contacto.phone?.trim() || null
  }
  
  if (contacto.taxId !== undefined) {
    supabaseData.nit = contacto.taxId?.trim() || null
  }
  
  if (contacto.address !== undefined) {
    supabaseData.direccion = contacto.address?.trim() || null
  }
  
  if (contacto.city !== undefined) {
    supabaseData.ciudad = contacto.city?.trim() || null
  }
  
  if (contacto.country !== undefined) {
    supabaseData.pais = contacto.country?.trim() || null
  }
  
  if (contacto.website !== undefined) {
    supabaseData.sitio_web = contacto.website?.trim() || null
  }
  
  if (contacto.notes !== undefined) {
    // Guardar notas: string vacío se guarda como string vacío, null/undefined como null
    supabaseData.notas = contacto.notes === null || contacto.notes === undefined 
      ? null 
      : String(contacto.notes)
  }

  // Mapear salesOwnerId del frontend a comercial en Supabase
  if (contacto.salesOwnerId !== undefined) {
    supabaseData.comercial = contacto.salesOwnerId || null
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
  comercial?: string
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

      // Aplicar filtros (normalizado sin tildes)
      if (options?.query && options.query.trim()) {
        const searchTerm = normalizeText(options.query.trim())
        queryBuilder = queryBuilder.or(
          `nombre.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
      }

      if (options?.relation && options.relation !== 'ALL') {
        // relacion es jsonb array: filtrar por contains (stringificado para PostgREST)
        const val = options.relation.trim()
        if (val === 'Cliente' || val === 'Proveedor') {
          queryBuilder = queryBuilder.contains('relacion', JSON.stringify([val]))
        }
      }

      if (options?.kind && options.kind !== 'ALL') {
        const tipoContacto = options.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
        queryBuilder = queryBuilder.eq('tipo_contacto', tipoContacto)
      }

      if (options?.comercial && options.comercial !== 'ALL') {
        if (options.comercial === 'none') {
          queryBuilder = queryBuilder.is('comercial', null)
        } else {
          queryBuilder = queryBuilder.eq('comercial', options.comercial)
        }
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

      // Aplicar filtros (normalizado sin tildes)
      if (options?.query && options.query.trim()) {
        const searchTerm = normalizeText(options.query.trim())
        queryBuilder = queryBuilder.or(
          `nombre.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        )
      }

      if (options?.relation && options.relation !== 'ALL') {
        // relacion es jsonb array: filtrar por contains (stringificado para PostgREST)
        const val = options.relation.trim()
        if (val === 'Cliente' || val === 'Proveedor') {
          queryBuilder = queryBuilder.contains('relacion', JSON.stringify([val]))
        }
      }

      if (options?.kind && options.kind !== 'ALL') {
        const tipoContacto = options.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
        queryBuilder = queryBuilder.eq('tipo_contacto', tipoContacto)
      }

      if (options?.comercial && options.comercial !== 'ALL') {
        if (options.comercial === 'none') {
          queryBuilder = queryBuilder.is('comercial', null)
        } else {
          queryBuilder = queryBuilder.eq('comercial', options.comercial)
        }
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
    return null
  }

  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Buscar contacto por nombre (para cotizaciones que guardan nombre en lugar de UUID).
 * Coincidencia exacta por nombre (trim, case insensitive). Devuelve el primero si hay varios.
 */
export async function findContactoByNombre(nombre: string): Promise<Contacto | null> {
  const trimmed = nombre?.trim()
  if (!trimmed) return null
  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .ilike('nombre', trimmed)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] Error finding contacto by nombre:', error)
    return null
  }

  if (!data) return null
  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Crear nuevo contacto
 * Valida campos requeridos y asegura valores por defecto según la estructura de la tabla
 */
export async function createContacto(contactoData: Partial<Contacto>): Promise<Contacto> {
  const now = new Date().toISOString()

  // Validar campo requerido: nombre
  if (!contactoData.displayName || contactoData.displayName.trim() === '') {
    throw new Error('El nombre es requerido')
  }

  // Convertir datos del frontend al formato de Supabase
  const supabaseData = contactoToSupabase(contactoData)
  
  // Validar que el nombre se mapeó correctamente
  if (!supabaseData.nombre || supabaseData.nombre.trim() === '') {
    throw new Error('El nombre es requerido')
  }

  // Asegurar valores por defecto para campos NOT NULL según la estructura de la tabla
  // tipo_contacto: NOT NULL DEFAULT 'Individual'
  if (!supabaseData.tipo_contacto) {
    supabaseData.tipo_contacto = 'Individual'
  }

  // relacion: jsonb array, default ['Cliente']
  if (!Array.isArray(supabaseData.relacion) || supabaseData.relacion.length === 0) {
    supabaseData.relacion = ['Cliente']
  }

  // pais: DEFAULT 'Bolivia' (aunque no es NOT NULL, es bueno tener un valor por defecto)
  if (!supabaseData.pais) {
    supabaseData.pais = 'Bolivia'
  }

  // Preparar datos para insertar
  // Los campos fecha_creacion y fecha_actualizacion tienen DEFAULT NOW()
  // pero los incluimos explícitamente para tener control
  const insertData: any = {
    nombre: supabaseData.nombre,
    tipo_contacto: supabaseData.tipo_contacto,
    relacion: supabaseData.relacion,
    pais: supabaseData.pais,
    fecha_creacion: now,
    fecha_actualizacion: now
  }

  // Agregar campos opcionales solo si tienen valor (solo columnas que existen en la tabla)
  if (supabaseData.empresa !== undefined) insertData.empresa = supabaseData.empresa
  if (supabaseData.company_id !== undefined) insertData.company_id = supabaseData.company_id
  if (supabaseData.razon_social !== undefined) insertData.razon_social = supabaseData.razon_social
  if (supabaseData.persona_contacto !== undefined) insertData.persona_contacto = supabaseData.persona_contacto
  if (supabaseData.email !== undefined) insertData.email = supabaseData.email
  if (supabaseData.telefono !== undefined) insertData.telefono = supabaseData.telefono
  if (supabaseData.nit !== undefined) insertData.nit = supabaseData.nit
  if (supabaseData.direccion !== undefined) insertData.direccion = supabaseData.direccion
  if (supabaseData.ciudad !== undefined) insertData.ciudad = supabaseData.ciudad
  if (supabaseData.sitio_web !== undefined) insertData.sitio_web = supabaseData.sitio_web
  if (supabaseData.notas !== undefined) insertData.notas = supabaseData.notas
  if (supabaseData.comercial !== undefined) insertData.comercial = supabaseData.comercial

  console.log('📋 Insertando contacto en Supabase:', {
    nombre: insertData.nombre,
    tipo_contacto: insertData.tipo_contacto,
    relacion: insertData.relacion,
    campos_opcionales: Object.keys(insertData).filter(k => !['nombre', 'tipo_contacto', 'relacion', 'pais', 'fecha_creacion', 'fecha_actualizacion', 'created_at', 'updated_at'].includes(k))
  })

  const { data, error } = await supabase
    .from('contactos')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando contacto en Supabase:')
    console.error('   Code:', error.code)
    console.error('   Message:', error.message)
    console.error('   Details:', error.details)
    console.error('   Hint:', error.hint)
    throw new Error(`Error al crear contacto: ${error.message}${error.details ? ` (${error.details})` : ''}`)
  }

  if (!data) {
    throw new Error('No se recibieron datos después de crear el contacto')
  }

  console.log('✅ Contacto creado exitosamente - ID:', data.id, 'Nombre:', data.nombre)
  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Actualizar contacto
 */
export async function updateContacto(
  id: string,
  updates: Partial<Contacto>
): Promise<Contacto | null> {
  // Convertir updates del frontend al formato de Supabase
  const supabaseUpdates = contactoToSupabase(updates)
  
  console.log('🔄 [updateContacto] Datos recibidos del frontend:', {
    razonSocial: updates.razonSocial,
    taxId: updates.taxId,
    website: updates.website,
    address: updates.address,
    address1: (updates as any).address1,
    city: updates.city,
    companyId: updates.companyId
  })
  
  console.log('🔄 [updateContacto] Datos convertidos a Supabase:', {
    razon_social: supabaseUpdates.razon_social,
    nit: supabaseUpdates.nit,
    sitio_web: supabaseUpdates.sitio_web,
    direccion: supabaseUpdates.direccion,
    ciudad: supabaseUpdates.ciudad,
    company_id: supabaseUpdates.company_id
  })
  
  // Construir updateData solo con columnas que existen en la tabla
  const updateData: any = {
    ...supabaseUpdates,
    fecha_actualizacion: new Date().toISOString()
  }

  // Eliminar cualquier campo que no exista en la tabla (por seguridad)
  const validColumns = [
    'nombre', 'tipo_contacto', 'relacion', 'empresa', 'company_id', 'razon_social', 'persona_contacto', 'email', 'telefono',
    'nit', 'direccion', 'ciudad', 'pais', 'sitio_web', 'notas', 'comercial',
    'fecha_creacion', 'fecha_actualizacion', 'created_at', 'updated_at'
  ]
  
  Object.keys(updateData).forEach(key => {
    if (!validColumns.includes(key)) {
      console.log(`⚠️ [updateContacto] Eliminando campo inválido: ${key}`)
      delete updateData[key]
    }
  })

  console.log('📋 [updateContacto] Datos finales a actualizar:', {
    id,
    campos: Object.keys(updateData),
    valores: {
      razon_social: updateData.razon_social,
      nit: updateData.nit,
      sitio_web: updateData.sitio_web,
      direccion: updateData.direccion,
      ciudad: updateData.ciudad,
      company_id: updateData.company_id
    }
  })

  const { data, error } = await supabase
    .from('contactos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating contacto:', { id, error: error.message, code: error.code })
    return null
  }

  // Si no hay data, el contacto no existe o no se actualizó
  if (!data) {
    return null
  }

  return supabaseToContacto(data as ContactoSupabase)
}

/**
 * Eliminar contacto
 */
export async function deleteContacto(id: string): Promise<boolean> {
  // Verificar que existe el contacto
  const contacto = await findContactoById(id)
  
  if (!contacto) {
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
  return count !== null && count > 0
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

