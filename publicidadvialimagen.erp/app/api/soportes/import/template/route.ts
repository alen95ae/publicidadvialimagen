import { NextResponse } from 'next/server'

export async function GET() {
  // CSV con UTF-8 BOM para Excel
  // ✅ Usar "Tipo de soporte" como cabecera oficial
  const csvContent = `\uFEFFCiudad,Disponibilidad,Titulo,Precio por mes,Codigo,Ancho,Alto,Impactos dia,Ubicación,Tipo de soporte
La Paz,Disponible,Valla publicitaria centro comercial,2500.00,LP-001,6.0,3.0,15000,https://maps.app.goo.gl/abc123,Vallas Publicitarias
Santa Cruz,Reservado,Pantalla digital plaza principal,4500.00,SC-002,4.0,2.5,25000,https://maps.app.goo.gl/def456,Pantallas LED
Cochabamba,Disponible,Mural publicitario avenida principal,1800.00,CB-003,8.0,4.0,8000,https://maps.app.goo.gl/ghi789,Murales
El Alto,Disponible,Publicidad móvil pasacalle,1200.00,EA-004,5.0,1.5,5000,https://maps.app.goo.gl/jkl012,Publicidad Móvil`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla-soportes.csv"'
    }
  })
}
