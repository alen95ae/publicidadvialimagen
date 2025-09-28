import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `code,title,type,widthM,heightM,city,country,priceMonth,status,owner,impactosDiarios,googleMapsLink
SM-001,Valla Centro,bipolar,20,15,Madrid,España,1500,DISPONIBLE,Imagen,2500,https://maps.google.com/maps?q=40.4168,-3.7038&z=15
SM-002,Pantalla Avenida,pantalla,5,3,Barcelona,España,800,OCUPADO,Publicidad,1800,https://maps.google.com/maps?q=41.3851,2.1734&z=15
SM-003,Mega Valla Industrial,mega valla,10,4,Valencia,España,1200,RESERVADO,Empresa,3200,https://maps.google.com/maps?q=39.4699,-0.3763&z=15`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="plantilla-soportes.csv"'
    }
  })
}
