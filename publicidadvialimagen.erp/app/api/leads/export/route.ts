export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAllLeads, findLeadById } from "@/lib/supabaseLeads"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { NextRequest } from "next/server"

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
    // Verificar autenticación
    const supabase = await getSupabaseUser(request as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    const query = searchParams.get('q') || ''
    const sectorFilter = searchParams.get('sector') || ''
    const interesFilter = searchParams.get('interes') || ''
    const origenFilter = searchParams.get('origen') || ''

    let leads

    if (idsParam) {
      // Exportar solo los leads con IDs específicos
      const ids = idsParam.split(',').map(id => id.trim()).filter(id => id)
      
      console.log(`📤 Exportando ${ids.length} leads específicos`)
      
      // Obtener leads por ID
      const promises = ids.map(id => findLeadById(id))
      const results = await Promise.all(promises)
      leads = results.filter(l => l !== null)
    } else {
      // Exportar leads con filtros aplicados
      console.log('📤 Exportando leads con filtros aplicados')
      const result = await getAllLeads({
        query,
        sector: sectorFilter,
        interes: interesFilter,
        origen: origenFilter
      })
      leads = result.data
    }

    // Construir CSV con todos los campos
    const headers = [
      "ID",
      "Nombre",
      "Empresa",
      "Email",
      "Teléfono",
      "Sector",
      "Interés",
      "Origen",
      "Creado"
    ]

    const csvRows: string[] = []
    
    // Agregar headers
    csvRows.push(headers.map(h => escapeCSV(h)).join(','))

    // Agregar filas de datos
    for (const lead of leads) {
      const createdDate = lead.created_at 
        ? new Date(lead.created_at).toLocaleDateString('es-ES')
        : ''

      const row = [
        escapeCSV(lead.id),
        escapeCSV(lead.nombre),
        escapeCSV(lead.empresa),
        escapeCSV(lead.email),
        escapeCSV(lead.telefono),
        escapeCSV(lead.sector),
        escapeCSV(lead.interes),
        escapeCSV(lead.origen),
        escapeCSV(createdDate)
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    // BOM UTF-8 para Excel y otros programas
    const csvWithBOM = '\uFEFF' + csv

    console.log(`✅ Exportados ${leads.length} leads a CSV`)

    // Convertir a Buffer con encoding UTF-8 explícito
    const csvBuffer = Buffer.from(csvWithBOM, 'utf-8')

    return new NextResponse(csvBuffer, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Encoding': 'utf-8',
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando leads:", e)
    return NextResponse.json({ error: "No se pudieron exportar los leads" }, { status: 500 })
  }
}

