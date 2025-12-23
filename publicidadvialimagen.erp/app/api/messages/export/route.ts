export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    // Usar cliente de usuario (RLS controla acceso por permisos)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''
    
    console.log('📤 Export mensajes params:', { estado })

    // Obtener todos los mensajes
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
    }

    // Mapear los campos de Supabase al formato esperado por el frontend
    const mensajes = (data || []).map((msg: any) => ({
      id: msg.id,
      nombre: msg.nombre || '',
      email: msg.email || '',
      telefono: msg.telefono || '',
      empresa: msg.empresa || '',
      mensaje: msg.mensaje || '',
      fecha_recepcion: msg.fecha || msg.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: msg.estado === 'LEIDO' ? 'LEÍDO' : (msg.estado || 'NUEVO'),
      origen: 'contacto' as const,
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }));

    // Filtrar por estado si se especifica
    let filteredMensajes = mensajes
    if (estado && estado !== 'all') {
      filteredMensajes = mensajes.filter(m => m.estado === estado)
    }

    // Crear CSV con headers
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Empresa',
      'Mensaje',
      'Fecha',
      'Estado'
    ]

    const csvRows = [headers.join(',')]

    // Agregar filas de datos
    for (const mensaje of filteredMensajes) {
      // Escapar comillas dobles y envolver en comillas para evitar problemas con comas y saltos de línea
      const escapeCSV = (value: string | null | undefined): string => {
        if (value === null || value === undefined) return '""'
        const str = String(value)
        // Reemplazar comillas dobles por dos comillas dobles (estándar CSV)
        const escaped = str.replace(/"/g, '""')
        // Envolver en comillas para manejar comas, saltos de línea, etc.
        return `"${escaped}"`
      }

      const row = [
        escapeCSV(mensaje.nombre),
        escapeCSV(mensaje.email),
        escapeCSV(mensaje.telefono),
        escapeCSV(mensaje.empresa),
        escapeCSV(mensaje.mensaje),
        escapeCSV(new Date(mensaje.fecha_recepcion).toLocaleDateString('es-ES')),
        escapeCSV(mensaje.estado)
      ]
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    // Agregar BOM (Byte Order Mark) para que Excel reconozca UTF-8 correctamente
    // Esto es crucial para que las tildes y ñ se muestren correctamente
    const csvWithBOM = '\uFEFF' + csv

    console.log(`✅ Exportados ${filteredMensajes.length} mensajes a CSV`)

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mensajes_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (e: any) {
    console.error("❌ Error exportando mensajes:", e)
    return NextResponse.json(
      { error: "No se pudieron exportar los mensajes" },
      { status: 500 }
    )
  }
}



