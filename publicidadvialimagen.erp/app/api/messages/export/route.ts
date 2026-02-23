export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { verifySession } from "@/lib/auth/verifySession"
import * as XLSX from "xlsx"

const HEADERS = [
  'Nombre',
  'Email',
  'Teléfono',
  'Empresa',
  'Mensaje',
  'Fecha',
  'Estado'
] as const

function rowFromMensaje(m: any): (string | number)[] {
  return [
    m.nombre ?? '',
    m.email ?? '',
    m.telefono ?? '',
    m.empresa ?? '',
    m.mensaje ?? '',
    m.fecha_recepcion ? new Date(m.fecha_recepcion).toLocaleDateString('es-ES') : '',
    m.estado ?? ''
  ]
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const payload = await verifySession(token)
    if (!payload?.sub) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''
    const idsParam = searchParams.get('ids')

    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
    }

    let mensajes = (data || []).map((msg: any) => ({
      id: msg.id,
      nombre: msg.nombre || '',
      email: msg.email || '',
      telefono: msg.telefono || '',
      empresa: msg.empresa || '',
      mensaje: msg.mensaje || '',
      fecha_recepcion: msg.fecha || msg.created_at || new Date().toISOString(),
      estado: msg.estado === 'LEIDO' ? 'LEÍDO' : (msg.estado || 'NUEVO'),
    }))

    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: "No se especificaron IDs" }, { status: 400 })
      }
      const idSet = new Set(ids)
      mensajes = mensajes.filter((m: any) => idSet.has(m.id))
      console.log(`📤 Exportando ${mensajes.length} formularios seleccionados`)
    } else if (estado && estado !== 'all') {
      const estados = estado.split(',')
      mensajes = mensajes.filter((m: any) => estados.includes(m.estado))
      console.log(`✅ Exportando ${mensajes.length} formularios a Excel (filtro estado)`)
    } else {
      console.log(`✅ Exportando ${mensajes.length} formularios a Excel`)
    }

    const wsData = [HEADERS as unknown as (string | number)[], ...mensajes.map(rowFromMensaje)]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Formularios')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = idsParam ? `formularios_seleccionados_${fecha}.xlsx` : `formularios_${fecha}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando mensajes:", e)
    return NextResponse.json({ error: "No se pudieron exportar los mensajes" }, { status: 500 })
  }
}
