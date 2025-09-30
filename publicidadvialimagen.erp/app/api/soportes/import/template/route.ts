import { NextResponse } from 'next/server'

export async function GET() {
  // CSV con UTF-8 BOM para Excel
  const csvContent = `\uFEFFCiudad,Disponibilidad,Titulo,Precio por mes,Codigo,Ancho,Alto,Impactos dia,Ubicación,Tipo
La Paz,Disponible,Valla publicitaria centro comercial,2500.00,LP-001,6.0,3.0,15000,https://maps.app.goo.gl/abc123,valla
Santa Cruz,Reservado,Pantalla digital plaza principal,4500.00,SC-002,4.0,2.5,25000,https://maps.app.goo.gl/def456,pantalla
Cochabamba,Disponible,Tótem publicitario avenida principal,1800.00,CB-003,2.0,4.0,8000,https://maps.app.goo.gl/ghi789,totem`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-soportes.csv"'
    }
  })
}
