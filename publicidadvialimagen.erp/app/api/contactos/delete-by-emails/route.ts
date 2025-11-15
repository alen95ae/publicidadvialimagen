import { NextResponse } from "next/server"
import { deleteContactosByEmails } from "@/lib/supabaseContactos"

/**
 * POST /api/contactos/delete-by-emails
 * Body: { emails: string[] }
 * Elimina todos los contactos cuyo Email coincida con cualquiera de los emails dados
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

    console.log(`🗑️ Eliminando contactos con emails:`, emails)

    // Eliminar contactos por email usando Supabase
    const deleted = await deleteContactosByEmails(emails)

    console.log(`✅ Eliminados ${deleted} contactos`)

    return NextResponse.json({ success: true, deleted, matched: deleted })
  } catch (error: any) {
    console.error('❌ Error delete-by-emails:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
