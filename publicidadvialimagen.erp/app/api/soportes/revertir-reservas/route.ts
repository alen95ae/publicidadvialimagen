import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabaseServer"
import { updateSoporte, getSoporteById } from "@/lib/supabaseSoportes"
import { addHistorialEvento } from "@/lib/supabaseHistorial"

export const dynamic = 'force-dynamic'
export const runtime = "nodejs";

/**
 * Endpoint para revertir automáticamente las reservas expiradas (más de 48h)
 * Este endpoint se puede llamar periódicamente desde un cron job
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    
    // Obtener todos los eventos de reserva que aún no han sido revertidos
    // Buscamos eventos de tipo RESERVA con fecha_expiracion en los datos
    const { data: eventosReserva, error: errorEventos } = await supabase
      .from('soportes_historial')
      .select('*')
      .eq('tipo_evento', 'RESERVA')
      .order('fecha', { ascending: false })

    if (errorEventos) {
      console.error('Error obteniendo eventos de reserva:', errorEventos)
      return NextResponse.json(
        { error: 'Error obteniendo eventos de reserva' },
        { status: 500 }
      )
    }

    if (!eventosReserva || eventosReserva.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay reservas para verificar",
        revertidos: 0
      })
    }

    const ahora = new Date()
    const reservasRevertidas = []
    const errores = []

    // Procesar cada evento de reserva
    for (const evento of eventosReserva) {
      try {
        // Verificar si el evento tiene fecha de expiración
        const datos = evento.datos as any
        if (!datos || !datos.fecha_expiracion || datos.tipo !== 'reserva_temporal') {
          continue // No es una reserva temporal, saltar
        }

        const fechaExpiracion = new Date(datos.fecha_expiracion)
        
        // Si la fecha de expiración ya pasó y el soporte aún está en estado Reservado
        if (fechaExpiracion < ahora) {
          const soporte = await getSoporteById(String(evento.soporte_id))
          
          if (soporte && soporte.estado === 'Reservado') {
            // Revertir al estado anterior
            const estadoAnterior = datos.estado_anterior || 'Disponible'
            
            await updateSoporte(String(evento.soporte_id), { estado: estadoAnterior })
            
            // Registrar en historial
            await addHistorialEvento({
              soporte_id: evento.soporte_id,
              tipo_evento: 'RESERVA',
              descripcion: `Reserva expirada automáticamente después de 48h, estado restaurado a: ${estadoAnterior}`,
              realizado_por: null, // Sistema automático
              datos: {
                estado_anterior: 'Reservado',
                estado_nuevo: estadoAnterior,
                tipo: 'expiracion_automatica',
                reserva_original_id: evento.id
              }
            })

            reservasRevertidas.push({
              soporte_id: evento.soporte_id,
              estado_anterior: estadoAnterior
            })
          }
        }
      } catch (error) {
        console.error(`Error procesando reserva para soporte ${evento.soporte_id}:`, error)
        errores.push({
          soporte_id: evento.soporte_id,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado: ${reservasRevertidas.length} reserva(s) revertida(s)`,
      revertidos: reservasRevertidas.length,
      reservas: reservasRevertidas,
      errores: errores.length > 0 ? errores : undefined
    })
  } catch (error) {
    console.error("Error en revertir reservas expiradas:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}














