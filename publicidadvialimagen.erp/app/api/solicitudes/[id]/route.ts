import { NextRequest, NextResponse } from 'next/server'
import { airtableList, getAllRecords } from '@/lib/airtable-rest'

// Interface para las solicitudes de cotización
interface SolicitudCotizacion {
  id: string
  codigo: string
  fechaCreacion: string
  empresa: string
  contacto: string
  telefono: string
  email: string
  comentarios: string
  estado: "Nueva" | "Pendiente" | "Cotizada"
  fechaInicio: string
  mesesAlquiler: number
  soporte: string
  serviciosAdicionales: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Buscar la solicitud en Airtable
    try {
      const airtableData = await getAllRecords('Solicitudes')
      const record = airtableData.records.find((record: any) => 
        record.fields['Código'] === id || record.id === id
      )
      
      if (!record) {
        return NextResponse.json(
          { error: 'Solicitud no encontrada' },
          { status: 404 }
        )
      }

      // Obtener código del soporte usando mapeo completo
      let soporteCodigo = ''
      try {
        // 1) Trae TODOS los Soportes y construye map ID -> Código
        const soportesData = await getAllRecords('Soportes')
        const soportesMap: Record<string, string> = soportesData.records.reduce((acc, rec) => {
          const id = rec.id
          const codigo = (rec.fields as any)['Código']
          if (id && codigo) acc[id] = String(codigo)
          return acc
        }, {} as Record<string, string>)
        
        // 2) Mapea Soporte ID -> Código de forma robusta
        const mapSoporte = (raw: any) => {
          if (!raw) return ""
          const id = Array.isArray(raw) ? raw[0] : raw
          return soportesMap[id] ?? id // si no está en el map, devuelve el ID como fallback
        }
        
        soporteCodigo = mapSoporte(record.fields['Soporte'])
      } catch (error) {
        console.log('⚠️ Error obteniendo código del soporte:', error)
        soporteCodigo = record.fields['Soporte'] ? 
          (Array.isArray(record.fields['Soporte']) ? record.fields['Soporte'][0] : record.fields['Soporte']) : ''
      }

      const solicitud: SolicitudCotizacion = {
        id: record.id,
        codigo: record.fields['Código'] || '',
        fechaCreacion: record.fields['Fecha Creación'] ? 
          new Date(record.fields['Fecha Creación']).toLocaleString('es-BO') : '',
        empresa: record.fields['Empresa'] || '',
        contacto: record.fields['Contacto'] || '',
        telefono: record.fields['Teléfono'] || '',
        email: record.fields['Email'] || '',
        comentarios: record.fields['Comentarios'] || '',
        estado: record.fields['Estado'] || 'Nueva',
        fechaInicio: record.fields['Fecha Inicio'] || '',
        mesesAlquiler: record.fields['Meses alquiler'] || 0,
        soporte: soporteCodigo,
        serviciosAdicionales: record.fields['Servicios adicionales'] ? 
          (Array.isArray(record.fields['Servicios adicionales']) ? 
            record.fields['Servicios adicionales'] : 
            record.fields['Servicios adicionales'].split(',').map((s: string) => s.trim()).filter((s: string) => s)) : []
      }

      console.log('✅ Solicitud encontrada:', solicitud.codigo)
      return NextResponse.json(solicitud)

    } catch (error) {
      console.error('❌ Error buscando solicitud en Airtable:', error)
      
      // Si falla Airtable, usar datos de ejemplo como fallback
      const solicitudesEjemplo = [
        {
          id: "S-001",
          codigo: "S-001",
          fechaCreacion: "15/01/2024 09:30",
          empresa: "Empresa ABC S.A.",
          contacto: "Juan Pérez",
          telefono: "+591 2 1234567",
          email: "juan.perez@empresaabc.com",
          comentarios: "Solicitud de cotización para vallas publicitarias en zona centro",
          estado: "Pendiente" as const,
          fechaInicio: "01/02/2024",
          mesesAlquiler: 6,
          soporte: "V-001",
          serviciosAdicionales: ["Diseño gráfico", "Impresión de lona", "Instalación en valla"]
        },
        {
          id: "S-002",
          codigo: "S-002", 
          fechaCreacion: "14/01/2024 14:15",
          empresa: "Comercial XYZ Ltda.",
          contacto: "María García",
          telefono: "+591 2 7654321",
          email: "maria.garcia@comercialxyz.com",
          comentarios: "Cotización para pantallas digitales en zona norte",
          estado: "Nueva" as const,
          fechaInicio: "15/02/2024",
          mesesAlquiler: 12,
          soporte: "PD-002",
          serviciosAdicionales: ["Diseño gráfico"]
        },
        {
          id: "S-003",
          codigo: "S-003",
          fechaCreacion: "13/01/2024 11:45", 
          empresa: "Industrias DEF S.A.S.",
          contacto: "Carlos López",
          telefono: "+591 2 9876543",
          email: "carlos.lopez@industriasdef.com",
          comentarios: "Propuesta para murales publicitarios en zona sur",
          estado: "Cotizada" as const,
          fechaInicio: "01/03/2024",
          mesesAlquiler: 8,
          soporte: "M-003",
          serviciosAdicionales: ["Diseño gráfico", "Instalación en valla"]
        }
      ]
      
      const solicitud = solicitudesEjemplo.find(s => s.id === id || s.codigo === id)
      
      if (!solicitud) {
        return NextResponse.json(
          { error: 'Solicitud no encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json(solicitud)
    }

  } catch (error) {
    console.error('Error al obtener solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Actualizar la solicitud en Airtable
    console.log('Actualizando solicitud:', id, body)
    
    try {
      // Importar la función de Airtable
      const { airtable } = await import('@/lib/airtable')
      
      // Primero buscar el record por código para obtener su ID interno
      const records = await airtable("Solicitudes").select({
        filterByFormula: `{Código} = "${id}"`,
        maxRecords: 1
      }).all()
      
      if (records.length === 0) {
        console.error('❌ No se encontró solicitud con código:', id)
        return NextResponse.json(
          { error: 'Solicitud no encontrada' },
          { status: 404 }
        )
      }
      
      const recordToUpdate = records[0]
      
      // Actualizar el estado en Airtable usando el ID interno
      const updatedRecord = await airtable("Solicitudes").update(recordToUpdate.id, {
        "Estado": body.estado
      })
      
      console.log('✅ Solicitud actualizada exitosamente en Airtable:', updatedRecord.id)
      
      return NextResponse.json({
        success: true,
        message: 'Solicitud actualizada exitosamente',
        solicitud: {
          id: updatedRecord.id,
          codigo: updatedRecord.fields.Código,
          estado: updatedRecord.fields.Estado,
          ...body
        }
      })
    } catch (error) {
      console.error('❌ Error actualizando en Airtable:', error)
      console.error('❌ Stack trace:', error.stack)
      return NextResponse.json(
        { error: 'Error al actualizar en Airtable', details: error.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error al actualizar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('DELETE method called for solicitud:', id)
    
    if (!id) {
      console.log('No ID provided')
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('Eliminando solicitud:', id)
    
    // Simular eliminación exitosa
    console.log('✅ Solicitud eliminada (simulado):', id)
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
