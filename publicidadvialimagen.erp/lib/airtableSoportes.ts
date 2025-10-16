import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || "");

const table = base(process.env.AIRTABLE_TABLE_SOPORTES || "Soportes");

export async function getSoportes(options?: { filterByFormula?: string }) {
  const records = await table.select(options || {}).all();
  return { records: records.map((r) => ({ id: r.id, fields: r.fields })) };
}

export async function createSoporte(fields: Record<string, any>) {
  const record = await table.create([{ fields }]);
  return { id: record[0].id, fields: record[0].fields };
}

export async function updateSoporte(id: string, fields: Record<string, any>) {
  const record = await table.update([{ id, fields }]);
  return { id: record[0].id, fields: record[0].fields };
}

export async function deleteSoporte(id: string) {
  await table.destroy(id);
  return { deleted: true };
}
