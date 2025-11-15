import { NextResponse } from "next/server"
import { getAllContactos, type Contacto } from "@/lib/supabaseContactos"

export async function GET() {
  try {
    // Obtener todos los contactos de Supabase
    const contactos = await getAllContactos()

    const duplicates: any[] = []
    const processed = new Set<string>()

    for (let i = 0; i < contactos.length; i++) {
      const a = contactos[i]
      if (processed.has(a.id)) continue

      const group: any[] = []
      for (let j = i + 1; j < contactos.length; j++) {
        const b = contactos[j]
        if (processed.has(b.id)) continue

        if (isSimilar(a, b)) {
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

    console.log(`✅ Encontrados ${duplicates.length} grupos de duplicados`)

    return NextResponse.json({ duplicates })
  } catch (error) {
    console.error("❌ Error detecting duplicates:", error)
    return NextResponse.json({ error: "Error detecting duplicates" }, { status: 500 })
  }
}

function toContactSummary(contacto: Contacto) {
  return {
    id: contacto.id,
    displayName: contacto.displayName || '',
    email: contacto.email || '',
    phone: contacto.phone || '',
    taxId: contacto.taxId || '',
  }
}

function isSimilar(a: Contacto, b: Contacto): boolean {
  const nameA = normalizeString(a.displayName || '')
  const nameB = normalizeString(b.displayName || '')
  const emailA = (a.email || '').toLowerCase().trim()
  const emailB = (b.email || '').toLowerCase().trim()
  const phoneA = normalizePhone(a.phone || '')
  const phoneB = normalizePhone(b.phone || '')
  const nitA = (a.taxId || '').trim()
  const nitB = (b.taxId || '').trim()

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
