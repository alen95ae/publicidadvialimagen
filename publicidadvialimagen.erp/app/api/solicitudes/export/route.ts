export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    // Usar cliente de usuario (RLS controla acceso)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const estadoFilterParam = searchParams.get('estado')

    // Obtener solicitudes usando cliente de usuario
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener solicitudes:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    // Convertir a formato esperado por el frontend
    let solicitudes = (data || []).map((record: any) => {
      const fechaCreacion = record.created_at 
        ? new Date(record.created_at).toLocaleString('es-BO')
        : new Date().toLocaleString('es-BO');

      return {
        id: record.id,
        codigo: record.codigo,
        fechaCreacion,
        empresa: record.empresa || '',
        contacto: record.contacto || '',
        telefono: record.telefono || '',
        email: record.email || '',
        comentarios: record.comentarios || '',
        estado: record.estado || 'Nueva',
        fechaInicio: record.fecha_inicio,
        mesesAlquiler: record.meses_alquiler,
        soporte: record.soporte,
        serviciosAdicionales: Array.isArray(record.servicios_adicionales) 
          ? record.servicios_adicionales 
          : (record.servicios_adicionales ? [record.servicios_adicionales] : [])
      };
    });

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



