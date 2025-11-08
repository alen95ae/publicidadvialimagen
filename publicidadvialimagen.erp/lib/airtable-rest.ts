// lib/airtable-rest.ts
const API = "https://api.airtable.com/v0";

const baseId = process.env.AIRTABLE_BASE_ID!;
const token  = process.env.AIRTABLE_API_KEY!;

if (!baseId || !token) {
  throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_API_KEY");
}

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function airtableList(table: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}/${baseId}/${encodeURIComponent(table)}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`List ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function airtableCreate(table: string, records: Array<{ fields: Record<string, any> }>) {
  const url = `${API}/${baseId}/${encodeURIComponent(table)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ records }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Create ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function airtableUpdate(table: string, id: string, fields: Record<string, any>) {
  const url = `${API}/${baseId}/${encodeURIComponent(table)}/${id}`;
  
  // Log detallado del payload que se envía
  const payload = { fields }
  console.log('➡️ airtableUpdate payload:', { table, id, fields: Object.keys(fields) })
  console.log('➡️ airtableUpdate payload (detalle):', JSON.stringify(payload, null, 2))
  
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  
  if (!res.ok) {
    const errorText = await res.text()
    let errorData: any = null
    try {
      errorData = JSON.parse(errorText)
    } catch {}
    
    console.error('❌ Error respuesta Airtable:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      errorData: errorData
    })
    throw new Error(`Update ${table} failed: ${res.status} ${errorText}`);
  }
  
  const result = await res.json()
  console.log('✅ airtableUpdate exitoso:', { table, id, fieldsUpdated: Object.keys(fields) })
  return result
}

export async function airtableUpsertByEmail(table: string, fields: Record<string, any>) {
  const url = `${API}/${baseId}/${encodeURIComponent(table)}`;
  const body = {
    performUpsert: { fieldsToMergeOn: ["Email"] },
    records: [{ fields }],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upsert ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function airtableDelete(table: string, id: string) {
  const url = `${API}/${baseId}/${encodeURIComponent(table)}/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Delete ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ✅ Trae TODOS los registros de una tabla (itera páginas de 100)
export async function getAllRecords(tableName: string, view?: string) {
  const allRecords: any[] = [];
  let offset: string | undefined;
  
  do {
    const params: Record<string, string> = { pageSize: "100" };
    if (offset) params.offset = offset;
    if (view) params.view = view;
    
    const response = await airtableList(tableName, params);
    allRecords.push(...response.records);
    offset = response.offset;
  } while (offset);
  
  return { records: allRecords };
}

// ✅ Trae una página concreta (para endpoints paginados)
export async function getRecordsPage(
  tableName: string,
  opts: { pageSize?: number; offset?: string; view?: string } = {}
) {
  const { pageSize = 50, offset, view } = opts;
  const params: Record<string, string> = { pageSize: pageSize.toString() };
  if (offset) params.offset = offset;
  if (view) params.view = view;
  
  return await airtableList(tableName, params);
}

export async function airtableGet(table: string, id: string) {
  const url = `${API}/${baseId}/${encodeURIComponent(table)}/${id}`;
  console.log('🔍 Fetching from Airtable:', url)
  
  const res = await fetch(url, {
    headers: headers(),
    cache: "no-store",
  });
  
  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ Error obteniendo registro de Airtable:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      table,
      id
    })
    throw new Error(`Get ${table} failed: ${res.status} ${errorText}`);
  }
  
  const data = await res.json();
  // La API de Airtable devuelve directamente el record cuando es GET individual
  // Asegurarnos de que tenga la estructura { id, fields }
  if (data && !data.fields && data.id) {
    // Si ya tiene id pero no fields, puede que sea un formato diferente
    console.warn('⚠️ Formato inesperado de respuesta de Airtable:', data)
  }
  return data;
}