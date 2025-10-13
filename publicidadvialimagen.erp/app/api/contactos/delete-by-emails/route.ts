import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

/**
 * POST /api/contactos/delete-by-emails
 * Body: { emails: string[] }
 * Elimina todos los contactos cuyo Email o Correo coincidan con cualquiera de los emails dados
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const emailsInput: unknown = body?.emails

    if (!Array.isArray(emailsInput) || emailsInput.length === 0) {
      return NextResponse.json({ error: "'emails' requerido (array)" }, { status: 400 })
    }

    // Normalizar emails (minúsculas y trim)
    const emails = emailsInput
      .map(e => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
      .filter(Boolean)

    if (emails.length === 0) {
      return NextResponse.json({ error: "Lista de emails vacía" }, { status: 400 })
    }

    // Buscar por Email exclusivamente (campo existente)
    const found: any[] = []
    for (const e of emails) {
      try {
        const rs = await airtable("Contactos").select({
          filterByFormula: `{Email} = "${e}"`,
        }).all()
        found.push(...rs)
      } catch (err) {
        console.error('❌ Error buscando por Email:', e, err)
      }
    }

    // Unificar por id
    const byId = new Map<string, any>()
    for (const r of found) byId.set(r.id, r)
    const records = Array.from(byId.values())

    if (!records.length) {
      return NextResponse.json({ success: true, deleted: 0, matched: 0 })
    }

    let deleted = 0
    // Eliminar uno a uno para manejo simple y claro
    for (const r of records) {
      try {
        await airtable("Contactos").destroy(r.id)
        deleted++
      } catch (err) {
        // Continuar con los demás
        console.error('❌ Error eliminando', r.id, err)
      }
    }

    return NextResponse.json({ success: true, deleted, matched: records.length })
  } catch (error: any) {
    console.error('❌ Error delete-by-emails:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}


