import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Headers del CSV con todos los campos de la tabla contactos
    const headers = [
      'Nombre',
      'Tipo de Contacto',
      'Empresa',
      'Email',
      'Teléfono',
      'NIT',
      'Dirección',
      'Ciudad',
      'Código Postal',
      'País',
      'Relación',
      'Sitio Web',
      'Notas'
    ]

    // Crear fila de ejemplo
    const exampleRow = [
      'Juan Pérez',
      'Individual',
      'Empresa ABC',
      'juan@empresa.com',
      '+591 70123456',
      '123456789',
      'Av. 16 de Julio 1234',
      'La Paz',
      '0000',
      'Bolivia',
      'Cliente',
      'https://empresa.com',
      'Contacto principal'
    ]

    // Crear CSV
    const csvContent = [
      headers.join(','),
      exampleRow.join(','),
      // Fila vacía para que el usuario pueda agregar más datos
      headers.map(() => '').join(',')
    ].join('\n')

    // Crear respuesta con el archivo CSV
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="template_contactos.csv"',
        'Cache-Control': 'no-cache'
      }
    })

    return response

  } catch (error) {
    console.error('Error generando template CSV:', error)
    return NextResponse.json({ 
      error: 'Error generando template' 
    }, { status: 500 })
  }
}
