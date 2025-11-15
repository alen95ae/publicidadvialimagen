export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getAllContactos, findContactoById } from "@/lib/supabaseContactos"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let contactos

    if (idsParam) {
      // Exportar solo los contactos con IDs específicos
      const ids = idsParam.split(',').map(id => id.trim()).filter(id => id)
      
      console.log(`📤 Exportando ${ids.length} contactos específicos`)
      
      // Obtener contactos por ID
      const promises = ids.map(id => findContactoById(id))
      const results = await Promise.all(promises)
      contactos = results.filter(c => c !== null)
    } else {
      // Exportar TODOS los contactos de la base de datos
      console.log('📤 Exportando todos los contactos')
      contactos = await getAllContactos()
    }

    // Construir CSV
    const headers = [
      "ID",
      "Nombre",
      "Tipo de Contacto",
      "Empresa",
      "Email",
      "Teléfono",
      "NIT",
      "Dirección",
      "Ciudad",
      "Código Postal",
      "País",
      "Relación",
      "Sitio Web",
      "Notas"
    ]

    const csvRows = [headers.join(',')]

    for (const contacto of contactos) {
      const kindDisplay = contacto.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
      const row = [
        contacto.id || '',
        `"${(contacto.displayName || '').toString().replace(/"/g, '""')}"`,
        `"${kindDisplay}"`,
        `"${(contacto.company || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.email || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.phone || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.taxId || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.address || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.city || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.postalCode || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.country || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.relation || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.website || '').toString().replace(/"/g, '""')}"`,
        `"${(contacto.notes || '').toString().replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    const csvWithBOM = '\uFEFF' + csv // BOM para Excel

    console.log(`✅ Exportados ${contactos.length} contactos a CSV`)

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contactos_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando contactos:", e)
    return NextResponse.json({ error: "No se pudieron exportar los contactos" }, { status: 500 })
  }
}
