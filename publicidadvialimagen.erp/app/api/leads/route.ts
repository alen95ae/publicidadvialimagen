export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAllLeads, createLead, type Lead } from "@/lib/supabaseLeads"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { NextRequest } from "next/server"

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseUser(request as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const sectorFilter = searchParams.get('sector') || ''
    const interesFilter = searchParams.get('interes') || ''
    const origenFilter = searchParams.get('origen') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    // Obtener leads de Supabase con filtros
    const result = await getAllLeads({
      query,
      sector: sectorFilter,
      interes: interesFilter,
      origen: origenFilter,
      page,
      limit
    })

    const total = result.total
    const totalPages = limit ? Math.ceil(total / limit) : 1

    const pagination = {
      page,
      limit: limit || total,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return NextResponse.json({ 
      data: result.data,
      pagination 
    })
  } catch (e: any) {
    console.error("❌ Error leyendo leads de Supabase:", e)
    return NextResponse.json({ error: "No se pudieron obtener los leads" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseUser(req as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    
    // Validar campos requeridos
    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim() === '') {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    // Validar formato de email si se proporciona
    if (body.email && body.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "El formato del email no es válido" },
          { status: 400 }
        )
      }
    }

    // Preparar datos del lead
    const leadData: Partial<Lead> = {
      nombre: body.nombre.trim()
    }

    // Agregar campos opcionales solo si tienen valor
    if (body.empresa && typeof body.empresa === 'string' && body.empresa.trim()) {
      leadData.empresa = body.empresa.trim()
    }
    
    if (body.email && typeof body.email === 'string' && body.email.trim()) {
      leadData.email = body.email.trim()
    }
    
    if (body.telefono && typeof body.telefono === 'string' && body.telefono.trim()) {
      leadData.telefono = body.telefono.trim()
    }
    
    if (body.ciudad && typeof body.ciudad === 'string' && body.ciudad.trim()) {
      leadData.ciudad = body.ciudad.trim()
    }
    
    if (body.sector && typeof body.sector === 'string' && body.sector.trim()) {
      leadData.sector = body.sector.trim()
    }
    
    if (body.interes && typeof body.interes === 'string' && body.interes.trim()) {
      leadData.interes = body.interes.trim()
    }
    
    if (body.origen && typeof body.origen === 'string' && body.origen.trim()) {
      leadData.origen = body.origen.trim()
    }

    // Crear lead en Supabase
    const nuevoLead = await createLead(leadData)

    // Devolver el lead creado
    return NextResponse.json(nuevoLead, { status: 201 })
  } catch (e: any) {
    // Log detallado del error para debugging
    console.error("❌ Error en POST /api/leads:")
    console.error("   Mensaje:", e.message)
    console.error("   Stack:", e.stack)
    
    // Devolver error con mensaje claro
    return NextResponse.json(
      { 
        error: "No se pudo crear el lead",
        details: e.message || "Error desconocido"
      },
      { status: 500 }
    )
  }
}

