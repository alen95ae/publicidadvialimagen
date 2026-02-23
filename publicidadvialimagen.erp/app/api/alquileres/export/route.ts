export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAlquileres, getAlquilerById } from "@/lib/supabaseAlquileres"
import { getSupabaseServer } from "@/lib/supabaseServer"
import * as XLSX from "xlsx"

// Columnas a exportar (sin ID ni Cotización ID)
const HEADERS = [
  'Código',
  'Fecha Inicio',
  'Fecha Fin',
  'Meses',
  'Soporte Código',
  'Cliente',
  'Vendedor',
  'Total',
  'Estado',
  'Fecha Creación'
] as const

function rowFromAlquiler(a: any): (string | number)[] {
  return [
    a.codigo || '',
    a.inicio ? new Date(a.inicio).toLocaleDateString('es-ES') : '',
    a.fin ? new Date(a.fin).toLocaleDateString('es-ES') : '',
    a.meses ?? '',
    a.soporte_codigo || '',
    a.cliente || '',
    a.vendedor || '',
    a.total ?? '',
    a.estado || '',
    a.fecha_creacion ? new Date(a.fecha_creacion).toLocaleDateString('es-ES') : ''
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let allAlquileres: any[] = []

    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: "No se especificaron IDs" }, { status: 400 })
      }
      const results = await Promise.all(ids.map(id => getAlquilerById(id)))
      const found = results.filter(Boolean) as any[]
      const soporteIds = [...new Set(found.map(a => a.soporte_id).filter(Boolean))]
      const codigosSoportes: Record<string | number, string> = {}
      if (soporteIds.length > 0) {
        const supabase = getSupabaseServer()
        const { data: soportesData } = await supabase
          .from("soportes")
          .select("id, codigo")
          .in("id", soporteIds)
        if (soportesData) {
          soportesData.forEach((s: any) => { codigosSoportes[s.id] = s.codigo || '' })
        }
      }
      allAlquileres = found.map(a => ({
        ...a,
        soporte_codigo: a.soporte_id ? codigosSoportes[a.soporte_id] ?? '' : ''
      }))
      console.log(`📤 Exportando ${allAlquileres.length} alquileres seleccionados`)
    } else {
      let page = 1
      const limit = 1000
      let hasMore = true
      while (hasMore) {
        const result = await getAlquileres({ page, limit })
        if (result.data && result.data.length > 0) {
          allAlquileres = [...allAlquileres, ...result.data]
          hasMore = result.data.length === limit
          page++
        } else {
          hasMore = false
        }
      }
      console.log(`📊 Total de alquileres a exportar: ${allAlquileres.length}`)
    }

    const wsData = [HEADERS as unknown as (string | number)[], ...allAlquileres.map(rowFromAlquiler)]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Alquileres')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const d = new Date()
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const nombreArchivo = idsParam ? `alquileres_seleccionados_${fecha}.xlsx` : `alquileres_${fecha}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando alquileres:", e)
    return NextResponse.json({ error: "No se pudieron exportar los alquileres" }, { status: 500 })
  }
}
