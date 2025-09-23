import { NextResponse } from 'next/server'

export async function GET() {
  const csvContent = `codigo,nombre,descripcion,categoria,cantidad,unidad_medida,coste,precio_venta,responsable,disponibilidad
INV-001,Impresora HP LaserJet,Impresora láser para oficina,Categoria general,2,unidad,250.00,350.00,Juan Pérez,Disponible
       INV-002,Papel A4 80g,Resma de papel blanco,Insumos,50,pieza,3.50,5.00,María García,Disponible
INV-003,Tinta Negra HP 305A,Cartucho de tinta original,Insumos,10,unidad,45.00,65.00,Carlos López,Disponible
INV-004,Monitor 24 pulgadas,Monitor LED Full HD,Categoria general,5,unidad,180.00,250.00,Ana Fernández,Disponible
INV-005,Cable HDMI 2m,Cable de conexión HDMI,Insumos,25,unidad,8.50,12.00,David Sánchez,Disponible`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="plantilla-inventario.csv"'
    }
  })
}
