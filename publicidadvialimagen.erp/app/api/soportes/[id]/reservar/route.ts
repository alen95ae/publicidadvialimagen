import { NextRequest, NextResponse } from "next/server"
import { requirePermisoTecnico } from "@/lib/permisos"
import { getSoporteById, updateSoporte } from "@/lib/supabaseSoportes"
import { addHistorialEvento, getHistorialSoporte } from "@/lib/supabaseHistorial"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"
import { getSupabaseServer } from "@/lib/supabaseServer"

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permiso técnico de reservar soportes (permite a vendedores reservar sin editar)
    const permisoCheck = await requirePermisoTecnico("reservar soportes")
    if (permisoCheck instanceof Response) {
      return permisoCheck
    }
    
    // Obtener userId del permiso check para usar en historial
    const userId = (permisoCheck && !(permisoCheck instanceof Response)) ? permisoCheck.userId : null

    const { id } = await params
    const body = await req.json()
    const { reservar, estado_anterior, desde_boton } = body

    if (typeof reservar !== 'boolean') {
      return NextResponse.json(
        { error: "El campo 'reservar' debe ser un booleano" },
        { status: 400 }
      )
    }

    // Obtener el soporte actual
    const soporte = await getSoporteById(id)
    if (!soporte) {
      return NextResponse.json(
        { error: "Soporte no encontrado" },
        { status: 404 }
      )
    }

    // Obtener usuario UUID para historial
    let userUuid: string | null = userId
    if (!userUuid) {
      const cookieStore = await cookies()
      const token = cookieStore.get("session")?.value
      if (token) {
        try {
          const session = await verifySession(token)
          userUuid = session?.sub || null
        } catch (e) {
          console.warn('No se pudo obtener sesión para historial:', e)
        }
      }
    }

    if (reservar) {
      // Marcar como reservado
      const estadoAnterior = estado_anterior || soporte.estado || 'Disponible'
      
      // Las 48h solo se aplican cuando viene del botón de reservar, no desde edición
      const aplicar48h = desde_boton === true
      let fechaExpiracion: Date | null = null
      
      if (aplicar48h) {
        fechaExpiracion = new Date()
        fechaExpiracion.setHours(fechaExpiracion.getHours() + 48) // 48 horas desde ahora
      }

      // Actualizar estado a Reservado
      await updateSoporte(id, { estado: 'Reservado' })

      // Registrar en historial
      const descripcion = aplicar48h 
        ? `Soporte marcado como reservado desde botón (expira el ${fechaExpiracion!.toLocaleString('es-ES')})`
        : `Soporte marcado como reservado desde edición (sin expiración automática)`
      
      await addHistorialEvento({
        soporte_id: typeof soporte.id === 'number' ? soporte.id : parseInt(String(soporte.id)),
        tipo_evento: 'RESERVA',
        descripcion,
        realizado_por: userUuid,
        datos: {
          estado_anterior: estadoAnterior,
          fecha_reserva: new Date().toISOString(),
          fecha_expiracion: fechaExpiracion ? fechaExpiracion.toISOString() : null,
          tipo: aplicar48h ? 'reserva_temporal' : 'reserva_manual',
          desde_boton: aplicar48h
        }
      })

      return NextResponse.json({
        success: true,
        message: aplicar48h 
          ? "Soporte marcado como reservado (expira en 48h)"
          : "Soporte marcado como reservado",
        fecha_expiracion: fechaExpiracion ? fechaExpiracion.toISOString() : null
      })
    } else {
      // Cancelar reserva - buscar el último evento de reserva para obtener el estado anterior
      let estadoAnterior = estado_anterior || 'Disponible'
      
      // Buscar el último evento de reserva para obtener el estado anterior guardado
      try {
        const historial = await getHistorialSoporte(typeof soporte.id === 'number' ? soporte.id : parseInt(String(soporte.id)))
        const ultimaReserva = historial.find(e => 
          e.tipo_evento === 'RESERVA' && 
          e.datos && 
          (e.datos as any).tipo === 'reserva_temporal'
        )
        
        if (ultimaReserva && ultimaReserva.datos) {
          const datosReserva = ultimaReserva.datos as any
          if (datosReserva.estado_anterior) {
            estadoAnterior = datosReserva.estado_anterior
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener el historial para buscar estado anterior:', error)
        // Usar el estado_anterior proporcionado o 'Disponible' por defecto
      }

      // Actualizar estado al anterior
      await updateSoporte(id, { estado: estadoAnterior })

      // Registrar en historial
      await addHistorialEvento({
        soporte_id: typeof soporte.id === 'number' ? soporte.id : parseInt(String(soporte.id)),
        tipo_evento: 'RESERVA',
        descripcion: `Reserva cancelada, estado restaurado a: ${estadoAnterior}`,
        realizado_por: userUuid,
        datos: {
          estado_anterior: 'Reservado',
          estado_nuevo: estadoAnterior,
          tipo: 'cancelacion_reserva'
        }
      })

      return NextResponse.json({
        success: true,
        message: "Reserva cancelada",
        estado_restaurado: estadoAnterior
      })
    }
  } catch (error) {
    console.error("Error en reservar/desreservar soporte:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}

