import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  console.log('DELETE method called for solicitudes')
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id || id.trim() === '') {
      console.log('⚠️ No ID provided or empty ID')
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('Eliminando solicitud:', id)
    
    try {
      // Importar la función de Airtable
      const { airtable } = await import('@/lib/airtable')
      
      // Buscar el record por código para obtener su ID interno
      const records = await airtable("Solicitudes").select({
        filterByFormula: `{Código} = "${id}"`,
        maxRecords: 1
      }).all()
      
      if (records.length === 0) {
        console.log('⚠️ No se encontró solicitud con código:', id)
        return NextResponse.json(
          { error: 'Solicitud no encontrada' },
          { status: 404 }
        )
      }
      
      const recordToDelete = records[0]
      console.log('🔍 Record encontrado para eliminar:', recordToDelete.id)
      
      // Eliminar el record de Airtable usando el ID interno
      await airtable("Solicitudes").destroy(recordToDelete.id)
      
      console.log('✅ Solicitud eliminada exitosamente de Airtable:', id)
      
      return NextResponse.json({
        success: true,
        message: 'Solicitud eliminada exitosamente'
      })
      
    } catch (error) {
      console.error('❌ Error eliminando de Airtable:', error)
      return NextResponse.json(
        { error: 'Error al eliminar en Airtable', details: error.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error al eliminar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
