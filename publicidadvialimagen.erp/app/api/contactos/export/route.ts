export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let records

    if (idsParam) {
      // Exportar solo los contactos con IDs específicos
      const ids = idsParam.split(',').map(id => id.trim()).filter(id => id)
      
      // Obtener registros por lotes (máximo 10 por lote en Airtable)
      const batchSize = 10
      const batches = []
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize)
        const batchRecords = await Promise.all(
          batchIds.map(id => airtable("Contactos").find(id).catch(() => null))
        )
        batches.push(...batchRecords.filter(r => r !== null))
      }
      records = batches
    } else {
      // Exportar TODOS los contactos de la base de datos
      records = await airtable("Contactos")
        .select({
          sort: [{ field: "Nombre", direction: "asc" }]
        })
        .all()
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

    for (const record of records) {
      const fields = record.fields as any
      const row = [
        record.id || '',
        `"${(fields['Nombre'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Tipo de Contacto'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Empresa'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Email'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Teléfono'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['NIT'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Dirección'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Ciudad'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Código Postal'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['País'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Relación'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Sitio Web'] || '').toString().replace(/"/g, '""')}"`,
        `"${(fields['Notas'] || '').toString().replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    const csvWithBOM = '\uFEFF' + csv // BOM para Excel

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contactos_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (e: any) {
    console.error("Error exportando contactos:", e)
    return NextResponse.json({ error: "No se pudieron exportar los contactos" }, { status: 500 })
  }
}

