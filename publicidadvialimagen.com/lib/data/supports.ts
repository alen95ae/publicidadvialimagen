import { airtableList } from "@/lib/airtable-rest";
const TABLE = process.env.AIRTABLE_TABLE_SOPORTES || "Soportes";

function pickLatLng(fields: any) {
  const lat = fields?.Lat ?? fields?.Latitud ?? fields?.Latitude ?? fields?.lat ?? fields?.LAT;
  const lng = fields?.Lng ?? fields?.Longitud ?? fields?.Longitude ?? fields?.lng ?? fields?.LNG;
  const toNum = (v: any) => (typeof v === "number" ? v : parseFloat(String(v).replace(",", ".")));
  return { lat: toNum(lat), lng: toNum(lng) };
}

export async function listSupportsPoints() {
  const data = await airtableList(TABLE, { pageSize: "200" });
  return (data.records || [])
    .map((r: any) => {
      const { lat, lng } = pickLatLng(r.fields);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { id: r.id, lat, lng, title: r.fields?.Nombre || r.fields?.Titulo || "Soporte" };
      }
      return null;
    })
    .filter(Boolean) as { id: string; lat: number; lng: number; title?: string }[];
}

export async function getSupportById(id: string) {
  const items = await listSupportsPoints();
  return items.find((item) => item.id === id) || null;
}
