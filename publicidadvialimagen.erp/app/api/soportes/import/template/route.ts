import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `code,title,type,widthM,heightM,city,country,address,latitude,longitude,priceMonth,pricePerM2,status,owner,impactosDiarios,googleMapsLink,iluminacion,images
SM-001,Valla Centro,bipolar,20,15,Madrid,España,Calle Gran Vía 1,40.4168,-3.7038,1500,75,DISPONIBLE,Imagen,2500,https://maps.google.com/maps?q=40.4168,-3.7038&z=15,true,"[]"
SM-002,Pantalla Avenida,pantalla,5,3,Barcelona,España,Passeig de Gràcia 100,41.3851,2.1734,800,53.33,OCUPADO,Publicidad,1800,https://maps.google.com/maps?q=41.3851,2.1734&z=15,false,"[]"
SM-003,Mega Valla Industrial,mega valla,10,4,Valencia,España,Avenida del Puerto 200,39.4699,-0.3763,1200,30,RESERVADO,Empresa,3200,https://maps.google.com/maps?q=39.4699,-0.3763&z=15,true,"[]"`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="plantilla-soportes.csv"'
    }
  })
}
