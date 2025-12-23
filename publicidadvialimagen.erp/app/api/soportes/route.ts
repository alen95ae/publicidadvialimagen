export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getSoportes, createSoporte } from "@/lib/supabaseSoportes"
import { soporteToSupport, buildSupabasePayload } from "./helpers"
import { uploadImage } from "@/lib/supabaseUpload"
import { requirePermiso } from "@/lib/permisos"
import { addHistorialEvento } from "@/lib/supabaseHistorial"
import { verifySession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    // Verificar permiso de ver
    const permisoCheck = await requirePermiso("soportes", "ver");
    if (permisoCheck instanceof Response) {
      return permisoCheck;
    }

    const url = new URL(request.url)
    const searchParams = url.searchParams
    const query = searchParams.get('q') || ''
    const statusFilter = searchParams.get('status') || ''
    const cityFilter = searchParams.get('city') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')


    // Obtener datos directamente de Supabase (sin conversiones Airtable)
    const result = await getSoportes({
      q: query,
      status: statusFilter,
      city: cityFilter,
      page,
      limit
    })

    // Convertir directamente de Supabase al formato del frontend
    const data = result.data.map(soporte => soporteToSupport(soporte))

    const total = result.count || 0
    const totalPages = Math.ceil(total / limit)

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    console.log('📊 Pagination:', pagination)
    console.log('📊 Data length:', data.length)

    return NextResponse.json({ 
      data,
      pagination 
    })
  } catch (e: any) {
    console.error("Error leyendo soportes de Supabase:", e)
    console.error("Error stack:", e?.stack)
    console.error("Error message:", e?.message)
    console.error("Error details:", JSON.stringify(e, null, 2))
    return NextResponse.json({ 
      error: "No se pudieron obtener los soportes",
      details: process.env.NODE_ENV === 'development' ? e?.message : undefined
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Verificar permiso de editar (crear requiere editar)
    const permisoCheck = await requirePermiso("soportes", "editar");
    if (permisoCheck instanceof Response) {
      return permisoCheck;
    }
    
    // Obtener userId del permiso check para usar en historial
    const userId = (permisoCheck && !(permisoCheck instanceof Response)) ? permisoCheck.userId : null

    // Detectar si viene como FormData (con archivos) o JSON
    const contentType = req.headers.get("content-type") || ""
    let body: any = {}
    
    if (contentType.includes("multipart/form-data")) {
      // Manejar FormData con archivos
      const formData = await req.formData()
      
      // Extraer campos de texto
      body.code = formData.get("code")?.toString()
      body.title = formData.get("title")?.toString()
      body.type = formData.get("type")?.toString()
      body.status = formData.get("status")?.toString()
      body.widthM = formData.get("widthM") ? parseFloat(formData.get("widthM")!.toString()) : null
      body.heightM = formData.get("heightM") ? parseFloat(formData.get("heightM")!.toString()) : null
      body.areaM2 = formData.get("areaM2") ? parseFloat(formData.get("areaM2")!.toString()) : null
      body.lighting = formData.get("lighting")?.toString()
      body.iluminacion = formData.get("iluminacion") === "true"
      body.priceMonth = formData.get("priceMonth") ? parseFloat(formData.get("priceMonth")!.toString()) : null
      body.impactosDiarios = formData.get("impactosDiarios") ? parseInt(formData.get("impactosDiarios")!.toString()) : null
      body.owner = formData.get("owner")?.toString()
      body.city = formData.get("city")?.toString()
      body.country = formData.get("country")?.toString()
      body.googleMapsLink = formData.get("googleMapsLink")?.toString()
      body.latitude = formData.get("latitude") ? parseFloat(formData.get("latitude")!.toString()) : null
      body.longitude = formData.get("longitude") ? parseFloat(formData.get("longitude")!.toString()) : null
      
      // Manejar archivos de imágenes
      const principalFile = formData.get("imagen_principal") as File | null
      const secundaria1File = formData.get("imagen_secundaria_1") as File | null
      const secundaria2File = formData.get("imagen_secundaria_2") as File | null
      
      // Subir imágenes si existen
      if (principalFile && principalFile.size > 0) {
        try {
          const imagenPrincipalUrl = await uploadImage(principalFile, principalFile.name)
          body.imagen_principal_url = imagenPrincipalUrl
        } catch (error) {
          console.error("Error subiendo imagen principal:", error)
        }
      }
      
      if (secundaria1File && secundaria1File.size > 0) {
        try {
          const imagenSecundaria1Url = await uploadImage(secundaria1File, secundaria1File.name)
          body.imagen_secundaria_1_url = imagenSecundaria1Url
        } catch (error) {
          console.error("Error subiendo imagen secundaria 1:", error)
        }
      }
      
      if (secundaria2File && secundaria2File.size > 0) {
        try {
          const imagenSecundaria2Url = await uploadImage(secundaria2File, secundaria2File.name)
          body.imagen_secundaria_2_url = imagenSecundaria2Url
        } catch (error) {
          console.error("Error subiendo imagen secundaria 2:", error)
        }
      }
    } else {
      // Manejar JSON simple
      body = await req.json()
    }
    
    if (!body.code || !body.title) {
      return NextResponse.json({ error: "Código y título son requeridos" }, { status: 400 })
    }
    
    // Usar buildSupabasePayload para construir el payload correctamente
    // Esto maneja automáticamente las imágenes desde el array 'images'
    const supabasePayload = await buildSupabasePayload(body)
    
    // Agregar created_at para nuevos registros
    supabasePayload.created_at = new Date().toISOString()
    
    // Si hay imágenes subidas desde FormData, agregarlas también
    if (body.imagen_principal_url) {
      supabasePayload.imagen_principal = [{ url: body.imagen_principal_url }]
    }
    
    if (body.imagen_secundaria_1_url) {
      supabasePayload.imagen_secundaria_1 = [{ url: body.imagen_secundaria_1_url }]
    }
    
    if (body.imagen_secundaria_2_url) {
      supabasePayload.imagen_secundaria_2 = [{ url: body.imagen_secundaria_2_url }]
    }
    
    // Crear en Supabase
    const soporte = await createSoporte(supabasePayload)

    // Registrar en historial
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
      
      await addHistorialEvento({
        soporte_id: soporte.id,
        tipo_evento: 'CREACION',
        descripcion: `Soporte creado: ${supabasePayload.titulo || supabasePayload.codigo || 'Sin título'}`,
        realizado_por: userUuid, // UUID del usuario
        datos: {
          codigo: supabasePayload.codigo,
          titulo: supabasePayload.titulo
        }
      })
      
    } catch (historialError) {
      console.error('⚠️ Error registrando historial de creación (no crítico):', historialError)
    }

    // Convertir directamente al formato del frontend
    return NextResponse.json(soporteToSupport(soporte), { status: 201 })
  } catch (e: any) {
    console.error("Error creando soporte en Supabase:", e)
    return NextResponse.json({ 
      error: "No se pudo crear el soporte",
      details: process.env.NODE_ENV === 'development' ? e?.message : undefined
    }, { status: 500 })
  }
}
