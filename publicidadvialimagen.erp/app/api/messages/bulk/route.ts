export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabaseServer'

interface BulkRequest {
  ids: string[]
  action: 'delete' | 'update'
  data?: any
}

export async function POST(req: NextRequest) {
  try {
    // Usar cliente de usuario (RLS controla acceso por permisos)
    const supabase = await getSupabaseUser(req);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { ids, action, data }: BulkRequest = await req.json()

    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'Sin IDs' }, { status: 400 })
    }

    if (action === 'delete') {
      let deletedCount = 0
      
      for (const id of ids) {
        try {
          const { error } = await supabase
            .from('mensajes')
            .delete()
            .eq('id', id)
          
          if (!error) {
            deletedCount += 1
          } else {
            console.error(`Error deleting message ${id}:`, error)
          }
        } catch (error) {
          console.error(`Error deleting message ${id}:`, error)
        }
      }
      return NextResponse.json({ ok: true, count: deletedCount })
    }

    if (action === 'update') {
      if (!data?.estado) {
        return NextResponse.json({ error: 'Solo se puede actualizar el campo estado' }, { status: 400 })
      }

      // Validar estado (aceptar tanto LEÍDO como LEIDO)
      const estadosValidos = ['NUEVO', 'LEÍDO', 'LEIDO', 'CONTESTADO']
      if (!estadosValidos.includes(data.estado)) {
        return NextResponse.json({ 
          error: 'Estado inválido. Debe ser: NUEVO, LEÍDO o CONTESTADO' 
        }, { status: 400 })
      }

      // Normalizar estado: convertir LEÍDO a LEIDO para la BD
      const estadoNormalizado = data.estado === 'LEÍDO' ? 'LEIDO' : data.estado
      
      let updatedCount = 0
      for (const id of ids) {
        try {
          const { error } = await supabase
            .from('mensajes')
            .update({ 
              estado: estadoNormalizado,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
          
          if (!error) {
            updatedCount += 1
          } else {
            console.error(`Error updating message ${id}:`, error)
          }
        } catch (error) {
          console.error(`Error updating message ${id}:`, error)
        }
      }

      return NextResponse.json({ ok: true, count: updatedCount })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error("Error in bulk action:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
