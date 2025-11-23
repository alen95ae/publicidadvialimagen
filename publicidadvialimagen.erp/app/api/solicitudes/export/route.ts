export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { getAllSolicitudes } from "@/lib/supabaseSolicitudes"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const estadoFilterParam = searchParams.get('estado')

    let solicitudes = await getAllSolicitudes()

    // Filtrar por estado si se proporciona
    if (estadoFilterParam && estadoFilterParam !== 'all') {
      const estados = estadoFilterParam.split(',')
      solicitudes = solicitudes.filter(s => estados.includes(s.estado))
    }

    // Función para escapar CSV correctamente
    const escapeCSV = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return '""'
      const str = String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const headers = [
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
    ]

    const csvRows = [headers.join(',')]

    solicitudes.forEach(solicitud => {
      const row = [
        escapeCSV(solicitud.codigo),
        escapeCSV(solicitud.fechaCreacion),
        escapeCSV(solicitud.empresa),
        escapeCSV(solicitud.contacto),
        escapeCSV(solicitud.telefono),
        escapeCSV(solicitud.email),
        escapeCSV(solicitud.comentarios),
        escapeCSV(solicitud.estado),
        escapeCSV(solicitud.fechaInicio),
        escapeCSV(solicitud.mesesAlquiler),
        escapeCSV(solicitud.soporte),
        escapeCSV((solicitud.serviciosAdicionales || []).join(', '))
      ]
      csvRows.push(row.join(','))
    })

    const csv = csvRows.join('\n')
    const csvWithBOM = '\uFEFF' + csv // BOM para Excel

    console.log(`📊 CSV solicitudes generado: ${solicitudes.length} filas`)

    const fecha = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD

    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="solicitudes_${fecha}.csv"`
      }
    })

  } catch (error) {
    console.error('❌ Error en export solicitudes:', error)
    return NextResponse.json(
      { success: false, error: 'Error al exportar solicitudes' },
      { status: 500 }
    )
  }
}



