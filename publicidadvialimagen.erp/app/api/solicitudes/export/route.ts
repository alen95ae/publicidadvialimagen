export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"
import * as XLSX from "xlsx"

const HEADERS = [
  'Código',
  'Fecha Creación',
  'Empresa',
  'Contacto',
  'Teléfono',
  'Email',
  'Comentarios',
  'Estado',
  'Fecha Inicio',
  'Meses Alquiler',
  'Soporte',
  'Servicios Adicionales'
] as const

function rowFromSolicitud(s: any): (string | number)[] {
  return [
    s.codigo ?? '',
    s.fechaCreacion ?? '',
    s.empresa ?? '',
    s.contacto ?? '',
    s.telefono ?? '',
    s.email ?? '',
    s.comentarios ?? '',
    s.estado ?? '',
    s.fechaInicio ?? '',
    s.mesesAlquiler ?? '',
    s.soporte ?? '',
    Array.isArray(s.serviciosAdicionales) ? s.serviciosAdicionales.join(', ') : (s.serviciosAdicionales ?? '')
  ]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseUser(request)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const estadoFilterParam = searchParams.get('estado')
    const idsParam = searchParams.get('ids')

    let solicitudes: any[]

    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length === 0) {
        return NextResponse.json({ error: "No se especificaron IDs" }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error al obtener solicitudes por ids:', error)
        return NextResponse.json({ error: 'Error al exportar' }, { status: 500 })
      }
      solicitudes = (data || []).map((record: any) => ({
        id: record.id,
        codigo: record.codigo,
        fechaCreacion: record.created_at ? new Date(record.created_at).toLocaleString('es-BO') : '',
        empresa: record.empresa || '',
        contacto: record.contacto || '',
        telefono: record.telefono || '',
        email: record.email || '',
        comentarios: record.comentarios || '',
        estado: record.estado || 'Nueva',
        fechaInicio: record.fecha_inicio,
        mesesAlquiler: record.meses_alquiler,
        soporte: record.soporte,
        serviciosAdicionales: Array.isArray(record.servicios_adicionales) ? record.servicios_adicionales : (record.servicios_adicionales ? [record.servicios_adicionales] : [])
      }))
      console.log(`📤 Exportando ${solicitudes.length} solicitudes seleccionadas`)
    } else {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error al obtener solicitudes:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
      }
      solicitudes = (data || []).map((record: any) => ({
        id: record.id,
        codigo: record.codigo,
        fechaCreacion: record.created_at ? new Date(record.created_at).toLocaleString('es-BO') : '',
        empresa: record.empresa || '',
        contacto: record.contacto || '',
        telefono: record.telefono || '',
        email: record.email || '',
        comentarios: record.comentarios || '',
        estado: record.estado || 'Nueva',
        fechaInicio: record.fecha_inicio,
        mesesAlquiler: record.meses_alquiler,
        soporte: record.soporte,
        serviciosAdicionales: Array.isArray(record.servicios_adicionales) ? record.servicios_adicionales : (record.servicios_adicionales ? [record.servicios_adicionales] : [])
      }))
      if (estadoFilterParam && estadoFilterParam !== 'all') {
        const estados = estadoFilterParam.split(',')
        solicitudes = solicitudes.filter(s => estados.includes(s.estado))
      }
      console.log(`📊 Exportando ${solicitudes.length} solicitudes a Excel`)
    }

    const wsData = [HEADERS as unknown as (string | number)[], ...solicitudes.map(rowFromSolicitud)]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = idsParam ? `solicitudes_seleccionadas_${fecha}.xlsx` : `solicitudes_${fecha}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error) {
    console.error('❌ Error en export solicitudes:', error)
    return NextResponse.json({ success: false, error: 'Error al exportar solicitudes' }, { status: 500 })
  }
}
