// Stub para compatibilidad - Este archivo existe solo para evitar errores de compilación
// Las funcionalidades se están migrando a Supabase

export interface AirtableRecord {
  id: string
  fields: Record<string, any>
}

export interface AirtableResponse {
  records: AirtableRecord[]
}

export interface AirtableListOptions {
  pageSize?: string | number
  filterByFormula?: string
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
}

/**
 * Stub function - Retorna array vacío
 */
export async function airtableList(
  table: string,
  options: AirtableListOptions = {}
): Promise<AirtableResponse> {
  console.warn(`⚠️ airtableList called for table "${table}" - This is a stub. Migrate to Supabase.`)
  return { records: [] }
}

/**
 * Stub function - Retorna un registro vacío
 */
export async function airtableCreate(
  table: string,
  records: Array<{ fields: Record<string, any> }>
): Promise<AirtableResponse> {
  console.warn(`⚠️ airtableCreate called for table "${table}" - This is a stub. Migrate to Supabase.`)
  // Generar IDs ficticios para compatibilidad
  const fakeRecords = records.map((_, index) => ({
    id: `stub_${Date.now()}_${index}`,
    fields: records[index].fields
  }))
  return { records: fakeRecords }
}

/**
 * Stub function - Retorna éxito
 */
export async function airtableUpdate(
  table: string,
  id: string,
  fields: Record<string, any>
): Promise<AirtableResponse> {
  console.warn(`⚠️ airtableUpdate called for table "${table}" id "${id}" - This is a stub. Migrate to Supabase.`)
  return { records: [{ id, fields }] }
}

/**
 * Stub function - Retorna un registro vacío
 */
export async function airtableUpsertByEmail(
  table: string,
  fields: Record<string, any>
): Promise<AirtableResponse> {
  console.warn(`⚠️ airtableUpsertByEmail called for table "${table}" - This is a stub. Migrate to Supabase.`)
  return { records: [{ id: `stub_${Date.now()}`, fields }] }
}

export default {
  list: airtableList,
  create: airtableCreate,
  update: airtableUpdate,
  upsertByEmail: airtableUpsertByEmail
}










