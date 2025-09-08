import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `code,title,type,widthM,heightM,city,country,priceMonth,status,owner,pricePerM2,imageUrl
SM-001,Edificio Centro,Edificio,20,15,Madrid,España,1500,DISPONIBLE,Imagen,5.0,/uploads/edificio1.jpg
SM-002,Cartel Avenida,Cartel,5,3,Barcelona,España,800,OCUPADO,Publicidad,4.5,/uploads/cartel1.jpg
SM-003,Valla Industrial,Valla,10,4,Valencia,España,1200,RESERVADO,Empresa,6.0,/uploads/valla1.jpg`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="plantilla-soportes.csv"'
    }
  })
}
