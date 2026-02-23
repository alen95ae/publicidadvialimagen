export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getSoportes, getSoporteById } from "@/lib/supabaseSoportes"
import { soporteToSupport } from "../helpers"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"

const HEADERS = [
  'Código',
  'Título',
  'Tipo de soporte',
  'Ciudad',
  'País',
  'Ancho (m)',
  'Alto (m)',
  'Área (m²)',
  'Precio/Mes',
  'Precio por m²',
  'Coste de producción',
  'Estado',
  'Empresa'
] as const

function rowFromSupport(s: any): (string | number)[] {
  const pricePerM2 = s.areaM2 && s.areaM2 > 0 && s.priceMonth != null
    ? (s.priceMonth / s.areaM2)
    : ''
  return [
    s.code ?? '',
    s.title ?? '',
    s.type ?? '',
    s.city ?? '',
    s.country ?? 'BO',
    s.widthM ?? '',
    s.heightM ?? '',
    s.areaM2 ?? '',
    s.priceMonth ?? '',
    pricePerM2,
    s.costeAlquiler ?? s.productionCost ?? '',
    s.status ?? '',
    s.company?.name ?? ''
  ]
}

export async function GET(request: Request) {
  try {
    const permisoCheck = await requirePermiso("soportes", "ver")
    if (permisoCheck instanceof Response) return permisoCheck

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let supports: any[] = []

    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: "No se especificaron IDs" }, { status: 400 })
      }
      const results = await Promise.all(ids.map(id => getSoporteById(id)))
      const soportes = results.filter(Boolean) as any[]
      supports = soportes.map(s => soporteToSupport(s))
      console.log(`📤 Exportando ${supports.length} soportes seleccionados`)
    } else {
      let page = 1
      const limit = 1000
      let hasMore = true
      while (hasMore) {
        const result = await getSoportes({ page, limit })
        if (result.data && result.data.length > 0) {
          supports = [...supports, ...result.data.map((s: any) => soporteToSupport(s))]
          hasMore = result.data.length === limit
          page++
        } else {
          hasMore = false
        }
      }
      console.log(`📊 Exportando ${supports.length} soportes a Excel`)
    }

    const wsData = [HEADERS as unknown as (string | number)[], ...supports.map(rowFromSupport)]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Soportes')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = idsParam ? `soportes_seleccionados_${fecha}.xlsx` : `soportes_${fecha}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando soportes:", e)
    return NextResponse.json({ error: "No se pudieron exportar los soportes" }, { status: 500 })
  }
}
