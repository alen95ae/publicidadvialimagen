import { NextResponse } from "next/server"
import { getSoporteById, updateSoporte, deleteSoporte } from "@/lib/supabaseSoportes"
import { buildSupabasePayload, rowToSupport } from "../helpers"
import { requirePermiso } from "@/lib/permisos"
import { addHistorialEvento } from "@/lib/supabaseHistorial"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(_:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
    // Verificar permiso de ver
    const permisoCheck = await requirePermiso("soportes", "ver");
    if (permisoCheck instanceof Response) {
      return permisoCheck;
    }

    const { id } = await params
    const record = await getSoporteById(id)
    
    if (!record) {
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    // getSoporteById devuelve un Soporte directamente, no con .fields
    return NextResponse.json(rowToSupport({ id: record.id, ...record }))
  }catch(e){
    console.error('GET soporte exception:', e)
    return NextResponse.json({ error:"Error interno del servidor" }, { status:500 })
  }
}

export async function PUT(req:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
    // Verificar permiso de editar
    const permisoCheck = await requirePermiso("soportes", "editar");
    if (permisoCheck instanceof Response) {
      return permisoCheck;
    }
    
    // Obtener userId del permiso check para usar en historial
    const userId = (permisoCheck && !(permisoCheck instanceof Response)) ? permisoCheck.userId : null

    const { id } = await params
    const body = await req.json()
    console.log('📝 PUT /api/soportes/[id] - ID recibido:', id, 'tipo:', typeof id)
    console.log('📝 PUT /api/soportes/[id] - Recibido body:', JSON.stringify(body, null, 2))
    console.log('🔍 Google Maps Link en el body:', body.googleMapsLink)
    
    if (!body.code || !body.title) {
      console.log('❌ Faltan campos requeridos:', { code: body.code, title: body.title })
      return NextResponse.json({ error:"Código y título son requeridos" }, { status:400 })
    }
    
    // Convertir ID a número si es necesario (Supabase usa number para id)
    const soporteId = isNaN(Number(id)) ? id : Number(id)
    console.log('🔢 ID convertido:', soporteId, 'tipo:', typeof soporteId)
    
    const existing = await getSoporteById(String(soporteId))
    
    if (!existing) {
      console.error('❌ Soporte no encontrado con ID:', soporteId)
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    console.log('📋 Registro existente encontrado:', existing.id, 'tipo ID:', typeof existing.id)
    
    // getSoporteById devuelve un Soporte directamente, no con .fields
    // Usar buildSupabasePayload para convertir a formato Supabase (snake_case)
    const payload = await buildSupabasePayload(body, existing)
    console.log('📤 Payload a enviar a Supabase:', JSON.stringify(payload, null, 2))
    console.log('🔗 Google Maps Link en payload:', payload.enlace_maps)
    console.log('📍 Coordenadas en payload:', { 
      lat: payload.latitud, 
      lng: payload.longitud,
      latType: typeof payload.latitud,
      lngType: typeof payload.longitud
    })
    
    // Validar coordenadas antes de enviar
    if (payload.latitud !== undefined && (isNaN(payload.latitud) || payload.latitud === null)) {
      console.warn('⚠️ Latitud inválida, removiendo del payload:', payload.latitud)
      delete payload.latitud
    }
    if (payload.longitud !== undefined && (isNaN(payload.longitud) || payload.longitud === null)) {
      console.warn('⚠️ Longitud inválida, removiendo del payload:', payload.longitud)
      delete payload.longitud
    }
    
    // Lista de campos válidos en la tabla soportes de Supabase (según el tipo Soporte)
    const validFields = [
      'codigo', 'titulo', 'tipo_soporte', 'estado', 'ancho', 'alto',
      'area_total', 'area_total_calculada', 'iluminacion', 'precio_mensual',
      'precio_m2_calculado', 'impactos_diarios', 'propietario', 'ciudad', 'zona', 'pais',
      'enlace_maps', 'latitud', 'longitud', 'imagen_principal', 'imagen_secundaria_1',
      'imagen_secundaria_2', 'resumen_ia', 'descripcion', 'sustrato',
      // Campos de costes
      'dueno_casa', 'temporalidad_pago', 'metodo_pago', 'estructura', 'coste_alquiler',
      'patentes', 'uso_suelos', 'luz', 'gastos_administrativos', 'comision_ejecutiva',
      'mantenimiento', 'notas'
    ]
    
    // Filtrar solo campos válidos y remover undefined
    const cleanPayload: any = {}
    validFields.forEach(field => {
      if (payload[field] !== undefined) {
        cleanPayload[field] = payload[field]
      }
    })
    
    // Validar que el payload no esté vacío
    if (Object.keys(cleanPayload).length === 0) {
      console.warn('⚠️ Payload vacío después de limpieza, usando datos existentes')
      return NextResponse.json(rowToSupport({ id: existing.id, ...existing }))
    }
    
    console.log('📤 Payload limpio a enviar:', JSON.stringify(cleanPayload, null, 2))
    console.log('📊 Campos en payload:', Object.keys(cleanPayload))
    
    try {
      const updated = await updateSoporte(String(soporteId), cleanPayload)
      console.log('✅ Soporte actualizado en Supabase:', updated.id)
      console.log('🔗 Google Maps Link guardado:', updated.enlace_maps)
      
      // Registrar en historial
      try {
        // Obtener ID del usuario (ya tenemos userId del permiso check, pero verificamos por si acaso)
        let userUuid: string | null = userId
        
        // Si no tenemos userId del permiso check, intentar obtenerlo de la sesión
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
        
        // Detectar cambios para crear descripción
        const cambios: string[] = []
        const datosHistorial: Record<string, any> = {}
        
        if (cleanPayload.estado && existing.estado !== cleanPayload.estado) {
          cambios.push('estado')
          datosHistorial.estado_anterior = existing.estado
          datosHistorial.estado_nuevo = cleanPayload.estado
        }
        if (cleanPayload.precio_mensual !== undefined && existing.precio_mensual !== cleanPayload.precio_mensual) {
          cambios.push('precio mensual')
          datosHistorial.valor_anterior = existing.precio_mensual
          datosHistorial.valor_nuevo = cleanPayload.precio_mensual
        }
        if (cleanPayload.titulo && existing.titulo !== cleanPayload.titulo) {
          cambios.push('título')
        }
        if (cleanPayload.ancho !== undefined && existing.ancho !== cleanPayload.ancho) {
          cambios.push('ancho')
        }
        if (cleanPayload.alto !== undefined && existing.alto !== cleanPayload.alto) {
          cambios.push('alto')
        }
        if (cleanPayload.ciudad && existing.ciudad !== cleanPayload.ciudad) {
          cambios.push('ciudad')
        }
        if (cleanPayload.tipo_soporte && existing.tipo_soporte !== cleanPayload.tipo_soporte) {
          cambios.push('tipo de soporte')
        }
        if (cleanPayload.iluminacion !== undefined && existing.iluminacion !== cleanPayload.iluminacion) {
          cambios.push('iluminación')
        }
        if (cleanPayload.enlace_maps && existing.enlace_maps !== cleanPayload.enlace_maps) {
          cambios.push('ubicación')
        }
        
        // Determinar tipo de evento
        let tipoEvento: 'EDICION' | 'CAMBIO_ESTADO' = 'EDICION'
        if (cambios.length === 1 && cambios[0] === 'estado') {
          tipoEvento = 'CAMBIO_ESTADO'
        }
        
        // Crear descripción
        const descripcion = cambios.length > 0
          ? `Se ${tipoEvento === 'CAMBIO_ESTADO' ? 'cambió el estado' : 'modificaron los siguientes campos'}: ${cambios.join(', ')}`
          : 'Se actualizó el soporte'
        
        // Insertar en historial
        await addHistorialEvento({
          soporte_id: typeof soporteId === 'number' ? soporteId : parseInt(String(soporteId)),
          tipo_evento: tipoEvento,
          descripcion,
          realizado_por: userUuid, // UUID del usuario, no email
          datos: Object.keys(datosHistorial).length > 0 ? datosHistorial : null
        })
        
        console.log('✅ Evento de historial registrado')
      } catch (historialError) {
        // No fallar la actualización si el historial falla
        console.error('⚠️ Error registrando historial (no crítico):', historialError)
      }
      
      // updateSoporte devuelve un Soporte directamente, no con .fields
      const result = rowToSupport({ id: updated.id, ...updated })
      console.log('📤 Respuesta al cliente:', {
        id: result.id,
        googleMapsLink: result.googleMapsLink,
        latitude: result.latitude,
        longitude: result.longitude
      })
      
      return NextResponse.json(result)
    } catch (updateError: any) {
      console.error('❌ Error en updateSoporte:', updateError)
      
      // Intentar extraer el mensaje de error de Supabase de múltiples formas
      let errorMessage = 'Error desconocido al actualizar'
      let errorDetails = ''
      
      if (updateError?.message) {
        errorMessage = updateError.message
      }
      if (updateError?.details) {
        errorDetails = updateError.details
      }
      if (updateError?.hint) {
        errorDetails += (errorDetails ? ' | ' : '') + `Hint: ${updateError.hint}`
      }
      if (updateError?.code) {
        errorMessage = `Error ${updateError.code}: ${errorMessage}`
      }
      
      // Si no hay mensaje, intentar otras formas
      if (errorMessage === 'Error desconocido al actualizar') {
        if (typeof updateError === 'string') {
          errorMessage = updateError
        } else if (updateError?.error?.message) {
          errorMessage = updateError.error.message
        } else {
          errorMessage = JSON.stringify(updateError)
        }
      }
      
      const fullError = errorDetails ? `${errorMessage} - ${errorDetails}` : errorMessage
      console.error('❌ Mensaje de error completo:', fullError)
      throw new Error(fullError)
    }
  }catch(e){
    console.error('❌ PUT soporte exception:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    const errorStack = e instanceof Error ? e.stack : undefined
    console.error('❌ Error details:', { errorMessage, errorStack })
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: errorMessage 
    }, { status:500 })
  }
}

export async function DELETE(_:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
    // Verificar permiso de eliminar
    const permisoCheck = await requirePermiso("soportes", "eliminar");
    if (permisoCheck instanceof Response) {
      return permisoCheck;
    }

    const { id } = await params
    const existing = await getSoporteById(id)
    
    if (!existing) {
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    // Obtener userId del permiso check para usar en historial
    const userId = (permisoCheck && !(permisoCheck instanceof Response)) ? permisoCheck.userId : null
    
    // Registrar en historial antes de eliminar
    try {
      // Si no tenemos userId del permiso check, intentar obtenerlo de la sesión
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
      
      const soporteIdNum = typeof existing.id === 'number' ? existing.id : parseInt(String(existing.id))
      await addHistorialEvento({
        soporte_id: soporteIdNum,
        tipo_evento: 'ELIMINACION',
        descripcion: `Soporte eliminado: ${existing.titulo || existing.codigo || 'Sin título'}`,
        realizado_por: userUuid, // UUID del usuario
        datos: {
          codigo: existing.codigo,
          titulo: existing.titulo
        }
      })
      
      console.log('✅ Evento de eliminación registrado en historial')
    } catch (historialError) {
      console.error('⚠️ Error registrando historial de eliminación (no crítico):', historialError)
    }
    
    await deleteSoporte(id)
    return NextResponse.json({ ok:true })
  }catch(e){
    console.error('DELETE soporte exception:', e)
    return NextResponse.json({ error:"Error interno del servidor" }, { status:500 })
  }
}
