import { NextResponse } from "next/server"
import { messagesService } from "@/lib/messages"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || ''
    
    console.log('📤 Export mensajes params:', { estado })

    // Obtener todos los mensajes
    const mensajes = await messagesService.getMessages()

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



