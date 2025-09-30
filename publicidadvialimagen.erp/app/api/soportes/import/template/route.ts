import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `Ciudad,Disponibilidad,Titulo,Precio_por_mes,Codigo,Ancho,Alto,Impactos_diarios,Ubicacion,Tipo
Santa Cruz,Disponible,Valla Centro,1500,SCZ-001,20,15,2500,https://maps.google.com/maps?q=-17.7833,-63.1821&z=15,bipolar
La Paz,Reservado,Pantalla Avenida,800,LPZ-002,5,3,1800,https://maps.google.com/maps?q=-16.5000,-68.1193&z=15,pantalla
Cochabamba,Disponible,Mega Valla Industrial,1200,CBB-003,10,4,3200,https://maps.google.com/maps?q=-17.3895,-66.1568&z=15,mega valla`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="plantilla-soportes.csv"'
    }
  })
}
