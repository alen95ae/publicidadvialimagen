import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET() {
  try {
    const records = await airtable("Contactos").select().all()

    const duplicates: any[] = []
    const processed = new Set<string>()

    for (let i = 0; i < records.length; i++) {
      const a = records[i]
      if (processed.has(a.id)) continue

      const group: any[] = []
      for (let j = i + 1; j < records.length; j++) {
        const b = records[j]
        if (processed.has(b.id)) continue

        if (isSimilar(a.fields, b.fields)) {
          group.push(b)
          processed.add(b.id)
        }
      }

      if (group.length > 0) {
        duplicates.push({
          primary: toContactSummary(a),
          duplicates: group.map(toContactSummary)
        })
        processed.add(a.id)
      }
    }

    return NextResponse.json({ duplicates })
  } catch (error) {
    console.error("❌ Error detecting duplicates:", error)
    return NextResponse.json({ error: "Error detecting duplicates" }, { status: 500 })
  }
}

function toContactSummary(r: any) {
  return {
    id: r.id,
    displayName: r.fields['Nombre'] || r.fields['Nombre Comercial'] || r.fields['Nombre Contacto'] || '',
    email: r.fields['Email'] || '',
    phone: r.fields['Teléfono'] || r.fields['Telefono'] || '',
    taxId: r.fields['NIT'] || r.fields['CIF'] || '',
  }
}

function isSimilar(a: any, b: any): boolean {
  const nameA = normalizeString(a['Nombre'] || a['Nombre Comercial'] || a['Nombre Contacto'] || '')
  const nameB = normalizeString(b['Nombre'] || b['Nombre Comercial'] || b['Nombre Contacto'] || '')
  const emailA = (a['Email'] || '').toLowerCase().trim()
  const emailB = (b['Email'] || '').toLowerCase().trim()
  const phoneA = normalizePhone(a['Teléfono'] || a['Telefono'] || '')
  const phoneB = normalizePhone(b['Teléfono'] || b['Telefono'] || '')
  const nitA = (a['NIT'] || a['CIF'] || '').trim()
  const nitB = (b['NIT'] || b['CIF'] || '').trim()

  const nameSimilar = nameA.length > 0 && (nameA === nameB || containsSimilar(nameA, nameB))
  const emailSimilar = !!emailA && emailA === emailB
  const phoneSimilar = !!phoneA && phoneA === phoneB
  const nitSimilar = !!nitA && nitA === nitB

  return nameSimilar || emailSimilar || phoneSimilar || nitSimilar
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsSimilar(a: string, b: string): boolean {
  if (!a || !b) return false
  const short = a.length <= b.length ? a : b
  const long = a.length > b.length ? a : b
  // considera similar si el corto está contenido y tiene al menos 5 chars
  return short.length >= 5 && long.includes(short)
}

function normalizePhone(phone: string): string {
  return String(phone || '').replace(/\D/g, '')
}


