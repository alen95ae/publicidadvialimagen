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
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Update ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
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