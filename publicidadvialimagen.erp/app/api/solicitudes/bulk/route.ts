import { NextRequest, NextResponse } from 'next/server'
import { airtableList, airtableUpdate } from '@/lib/airtable-rest'

export async function POST(request: NextRequest) {
  try {
    const { ids, action, data } = await request.json()
    console.log(`📋 Bulk action: ${action} for solicitud IDs:`, ids, 'with data:', data)

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'No se proporcionaron IDs' }, { status: 400 })
    }

    if (action === 'update') {
      if (!data || !data.estado) {
        return NextResponse.json({ success: false, error: 'Estado requerido para actualizar' }, { status: 400 })
      }

      // Obtener todas las solicitudes para encontrar los IDs de Airtable por código
      const airtableData = await airtableList('Solicitudes')
      const codigoToIdMap: Record<string, string> = {}
      
      airtableData.records.forEach((record: any) => {
        const codigo = record.fields['Código']
        if (codigo) {
          codigoToIdMap[codigo] = record.id
        }
      })

      // Actualizar múltiples solicitudes
      const promises = ids
        .filter((codigo: string) => codigoToIdMap[codigo]) // Solo procesar códigos que existen
        .map((codigo: string) => {
          const airtableId = codigoToIdMap[codigo]
          return airtableUpdate('Solicitudes', airtableId, {
            'Estado': data.estado
          })
        })
      
      await Promise.all(promises)
      
      return NextResponse.json({
        success: true,
        message: `${promises.length} solicitud(es) actualizada(s) correctamente`,
        count: promises.length
      })
    }

    if (action === 'delete') {
      // La eliminación ya está implementada en /api/solicitudes/delete
      return NextResponse.json(
        { success: false, error: 'Use /api/solicitudes/delete para eliminar solicitudes' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error en operación bulk de solicitudes:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


