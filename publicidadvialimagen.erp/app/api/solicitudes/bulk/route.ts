export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

interface BulkRequest {
  ids: string[]
  action: 'delete' | 'update'
  data?: any
}

export async function POST(req: NextRequest) {
  try {
    // Usar admin directamente para evitar problemas de RLS
    // Esto es seguro para un ERP interno donde los usuarios ya están autenticados
    const supabase = getSupabaseAdmin()

    const { ids, action, data }: BulkRequest = await req.json()

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Sin IDs' }, { status: 400 })
    }

    // Función helper para detectar si es UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = (id: string) => uuidPattern.test(id);

    if (action === 'delete') {
      let deletedCount = 0
      for (const id of ids) {
        try {
          let result;
          if (isUUID(id)) {
            result = await supabase
              .from('solicitudes')
              .delete()
              .eq('id', id)
          } else {
            result = await supabase
              .from('solicitudes')
              .delete()
              .eq('codigo', id)
          }
          
          if (!result.error) {
            deletedCount += 1
          } else {
            console.error(`[BULK DELETE] Error deleting solicitud ${id}:`, result.error)
          }
        } catch (error) {
          console.error(`[BULK DELETE] Error deleting solicitud ${id}:`, error)
        }
      }
      return NextResponse.json({ ok: true, count: deletedCount })
    }

    if (action === 'update') {
      if (!data?.estado) {
        return NextResponse.json({ error: 'Solo se puede actualizar el campo estado' }, { status: 400 })
      }

      // Validar estado
      const estadosValidos = ['Nueva', 'Pendiente', 'Cotizada']
      if (!estadosValidos.includes(data.estado)) {
        return NextResponse.json({ 
          error: 'Estado inválido. Debe ser: Nueva, Pendiente o Cotizada' 
        }, { status: 400 })
      }
      
      let updatedCount = 0
      for (const id of ids) {
        try {
          let result;
          if (isUUID(id)) {
            result = await supabase
              .from('solicitudes')
              .update({ 
                estado: data.estado,
                updated_at: new Date().toISOString()
              })
              .eq('id', id)
          } else {
            result = await supabase
              .from('solicitudes')
              .update({ 
                estado: data.estado,
                updated_at: new Date().toISOString()
              })
              .eq('codigo', id)
          }
          
          if (!result.error) {
            updatedCount += 1
          } else {
            console.error(`[BULK UPDATE] Error updating solicitud ${id}:`, result.error)
          }
        } catch (error) {
          console.error(`[BULK UPDATE] Error updating solicitud ${id}:`, error)
        }
      }

      console.log(`[BULK UPDATE] ✅ ${updatedCount} solicitud(es) actualizada(s)`)
      return NextResponse.json({ ok: true, count: updatedCount })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error("[BULK] Error inesperado:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
