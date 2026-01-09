import { getSupabaseServer } from './supabaseServer'

// Usar el cliente del servidor que bypassa RLS
const supabase = getSupabaseServer()

export interface Formato {
  id: string
  formato: string
  cantidad: number
  unidad_medida: string
  fecha_creacion?: string
  fecha_actualizacion?: string
}

export interface FormatoInput {
  formato: string
  cantidad: number
  unidad_medida: string
}

export async function getAllFormatos(): Promise<Formato[]> {
  
  const { data, error } = await supabase
    .from('formato')
    .select('*')
    .order('formato', { ascending: true })

  if (error) {
    console.error('❌ Error obteniendo formatos:', error)
    throw new Error(`Error obteniendo formatos: ${error.message}`)
  }

  return (data || []).map(formatFormato)
}

export async function getFormatoById(id: string): Promise<Formato | null> {
  
  const { data, error } = await supabase
    .from('formato')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('❌ Error obteniendo formato:', error)
    throw new Error(`Error obteniendo formato: ${error.message}`)
  }

  return data ? formatFormato(data) : null
}

export async function createFormato(input: FormatoInput): Promise<Formato> {
  
  const { data, error } = await supabase
    .from('formato')
    .insert({
      formato: input.formato.trim(),
      cantidad: input.cantidad,
      unidad_medida: input.unidad_medida
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creando formato:', error)
    throw new Error(`Error creando formato: ${error.message}`)
  }

  return formatFormato(data)
}

export async function updateFormato(id: string, input: Partial<FormatoInput>): Promise<Formato> {
  
  const updateData: any = {}
  if (input.formato !== undefined) updateData.formato = input.formato.trim()
  if (input.cantidad !== undefined) updateData.cantidad = input.cantidad
  if (input.unidad_medida !== undefined) updateData.unidad_medida = input.unidad_medida

  const { data, error } = await supabase
    .from('formato')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error actualizando formato:', error)
    throw new Error(`Error actualizando formato: ${error.message}`)
  }

  return formatFormato(data)
}

export async function deleteFormato(id: string): Promise<void> {
  
  const { error } = await supabase
    .from('formato')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('❌ Error eliminando formato:', error)
    throw new Error(`Error eliminando formato: ${error.message}`)
  }
}

function formatFormato(record: any): Formato {
  return {
    id: record.id,
    formato: record.formato || '',
    cantidad: Number(record.cantidad) || 0,
    unidad_medida: record.unidad_medida || '',
    fecha_creacion: record.fecha_creacion,
    fecha_actualizacion: record.fecha_actualizacion
  }
}
