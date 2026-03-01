export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAllLeads, findLeadById } from "@/lib/supabaseLeads"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { NextRequest } from "next/server"
import { formatDateBolivia } from "@/lib/utils"
import * as XLSX from "xlsx"

// Columnas a exportar (sin ID)
const HEADERS = [
  "Nombre",
  "Empresa",
  "Email",
  "Teléfono",
  "Sector",
  "Interés",
  "Origen",
  "Creado"
] as const

function rowFromLead(lead: any): (string | number)[] {
  const createdDate = lead.created_at
    ? formatDateBolivia(lead.created_at)
    : ''
  return [
    lead.nombre ?? '',
    lead.empresa ?? '',
    lead.email ?? '',
    lead.telefono ?? '',
    lead.sector ?? '',
    lead.interes ?? '',
    lead.origen ?? '',
    createdDate
  ]
}

export async function GET(request: Request) {
  try {
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
      const ids = idsParam.split(',').map(id => id.trim()).filter(id => id)
      console.log(`📤 Exportando ${ids.length} leads específicos`)
      const promises = ids.map(id => findLeadById(id))
      const results = await Promise.all(promises)
      leads = results.filter(l => l !== null)
    } else {
      console.log('📤 Exportando leads con filtros aplicados')
      const result = await getAllLeads({
        query,
        sector: sectorFilter,
        interes: interesFilter,
        origen: origenFilter
      })
      leads = result.data
    }

    const wsData = [
      [...HEADERS],
      ...leads.map((l: any) => rowFromLead(l))
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = idsParam ? `leads_seleccionados_${fecha}.xlsx` : `leads_${fecha}.xlsx`

    console.log(`✅ Exportados ${leads.length} leads a Excel`)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando leads:", e)
    return NextResponse.json({ error: "No se pudieron exportar los leads" }, { status: 500 })
  }
}
