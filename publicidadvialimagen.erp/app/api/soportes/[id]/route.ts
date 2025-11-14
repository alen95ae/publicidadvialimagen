import { NextResponse } from "next/server"
import { getSoporteById, updateSoporte, deleteSoporte } from "@/lib/supabaseSoportes"
import { buildSupabasePayload, rowToSupport } from "../helpers"

export async function GET(_:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
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
    const payload = buildSupabasePayload(body, existing)
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
      'precio_m2_calculado', 'impactos_diarios', 'propietario', 'ciudad', 'pais',
      'enlace_maps', 'latitud', 'longitud', 'imagen_principal', 'imagen_secundaria_1',
      'imagen_secundaria_2', 'resumen_ia'
      // Nota: direccion_notas no está en el tipo Soporte, se omite por ahora
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
    const { id } = await params
    const existing = await getSoporteById(id)
    
    if (!existing) {
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    await deleteSoporte(id)
    return NextResponse.json({ ok:true })
  }catch(e){
    console.error('DELETE soporte exception:', e)
    return NextResponse.json({ error:"Error interno del servidor" }, { status:500 })
  }
}
