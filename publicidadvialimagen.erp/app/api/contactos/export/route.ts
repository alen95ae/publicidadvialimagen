export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getAllContactos, findContactoById } from "@/lib/supabaseContactos"
import { getUserByIdSupabase } from "@/lib/supabaseUsers"

// Función para escapar CSV correctamente (maneja tildes, ñ y caracteres especiales)
function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escapar comillas dobles duplicándolas
  const escaped = str.replace(/"/g, '""')
  // Envolver en comillas para manejar comas, saltos de línea, etc.
  return `"${escaped}"`
}

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

    // Obtener todos los comerciales para mapear IDs a nombres
    const salesOwnerIds = new Set<string>()
    contactos.forEach(c => {
      if (c.salesOwnerId) {
        salesOwnerIds.add(c.salesOwnerId)
      }
    })

    const salesOwnersMap: Record<string, string> = {}
    if (salesOwnerIds.size > 0) {
      const promises = Array.from(salesOwnerIds).map(async (id) => {
        const user = await getUserByIdSupabase(id)
        if (user) {
          salesOwnersMap[id] = user.nombre || user.email || ''
        }
      })
      await Promise.all(promises)
    }

    // Construir CSV con todos los campos del listado
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
      "País",
      "Relación",
      "Sitio Web",
      "Comercial",
      "Notas"
    ]

    const csvRows: string[] = []
    
    // Agregar headers
    csvRows.push(headers.map(h => escapeCSV(h)).join(','))

    // Agregar filas de datos
    for (const contacto of contactos) {
      const kindDisplay = contacto.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
      const relationDisplay = contacto.relation === 'CUSTOMER' ? 'Cliente' 
        : contacto.relation === 'SUPPLIER' ? 'Proveedor'
        : contacto.relation === 'BOTH' ? 'Ambos'
        : contacto.relation || ''
      const comercialName = contacto.salesOwnerId && salesOwnersMap[contacto.salesOwnerId] 
        ? salesOwnersMap[contacto.salesOwnerId] 
        : ''

      const row = [
        escapeCSV(contacto.id),
        escapeCSV(contacto.displayName),
        escapeCSV(kindDisplay),
        escapeCSV(contacto.company),
        escapeCSV(contacto.email),
        escapeCSV(contacto.phone),
        escapeCSV(contacto.taxId),
        escapeCSV(contacto.address),
        escapeCSV(contacto.city),
        escapeCSV(contacto.country),
        escapeCSV(relationDisplay),
        escapeCSV(contacto.website),
        escapeCSV(comercialName),
        escapeCSV(contacto.notes)
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    // BOM UTF-8 para Excel y otros programas
    const csvWithBOM = '\uFEFF' + csv

    console.log(`✅ Exportados ${contactos.length} contactos a CSV`)

    // Convertir a Buffer con encoding UTF-8 explícito
    const csvBuffer = Buffer.from(csvWithBOM, 'utf-8')

    return new NextResponse(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contactos_${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Encoding': 'utf-8',
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando contactos:", e)
    return NextResponse.json({ error: "No se pudieron exportar los contactos" }, { status: 500 })
  }
}
