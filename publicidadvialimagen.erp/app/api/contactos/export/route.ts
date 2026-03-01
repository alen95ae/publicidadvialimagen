export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAllContactos, findContactoById } from "@/lib/supabaseContactos"
import { getUserByIdSupabase } from "@/lib/supabaseUsers"
import * as XLSX from "xlsx"

// Columnas a exportar (sin ID)
const HEADERS = [
  "Nombre",
  "Tipo de Contacto",
  "Empresa",
  "Email",
  "Teléfono",
  "NIT",
  "Dirección",
  "Ciudad",
  "País",
  "Relación",
  "Sitio Web",
  "Comercial",
  "Notas"
] as const

function rowFromContacto(contacto: any, salesOwnersMap: Record<string, string>): (string | number)[] {
  const kindDisplay = contacto.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
  const relationDisplay = Array.isArray(contacto.relation) && contacto.relation.length > 0
    ? contacto.relation.join(", ")
    : ""
  const comercialName = contacto.salesOwnerId && salesOwnersMap[contacto.salesOwnerId]
    ? salesOwnersMap[contacto.salesOwnerId]
    : ''
  return [
    contacto.displayName ?? '',
    kindDisplay,
    contacto.company ?? '',
    contacto.email ?? '',
    contacto.phone ?? '',
    contacto.taxId ?? '',
    contacto.address ?? '',
    contacto.city ?? '',
    contacto.country ?? '',
    relationDisplay,
    contacto.website ?? '',
    comercialName,
    contacto.notes ?? ''
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let contactos

    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(id => id)
      console.log(`📤 Exportando ${ids.length} contactos específicos`)
      const promises = ids.map(id => findContactoById(id))
      const results = await Promise.all(promises)
      contactos = results.filter(c => c !== null)
    } else {
      console.log('📤 Exportando todos los contactos')
      contactos = await getAllContactos()
    }

    const salesOwnerIds = new Set<string>()
    contactos.forEach((c: any) => {
      if (c.salesOwnerId) salesOwnerIds.add(c.salesOwnerId)
    })

    const salesOwnersMap: Record<string, string> = {}
    if (salesOwnerIds.size > 0) {
      const promises = Array.from(salesOwnerIds).map(async (id) => {
        const user = await getUserByIdSupabase(id)
        if (user) salesOwnersMap[id] = user.nombre || user.email || ''
      })
      await Promise.all(promises)
    }

    const wsData = [
      [...HEADERS],
      ...contactos.map((c: any) => rowFromContacto(c, salesOwnersMap))
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = idsParam ? `contactos_seleccionados_${fecha}.xlsx` : `contactos_todos_${fecha}.xlsx`

    console.log(`✅ Exportados ${contactos.length} contactos a Excel`)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando contactos:", e)
    return NextResponse.json({ error: "No se pudieron exportar los contactos" }, { status: 500 })
  }
}
