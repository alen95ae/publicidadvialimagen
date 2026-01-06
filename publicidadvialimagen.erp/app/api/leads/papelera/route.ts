export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getAllLeads } from "@/lib/supabaseLeads"
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
    const page = parseInt(searchParams.get('page') || '1')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    // Obtener leads eliminados (deleted_at no null) de Supabase
    const result = await getAllLeads({
      query,
      page,
      limit,
      includeDeleted: true // Solo mostrar eliminados
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
    console.error("❌ Error leyendo leads de papelera:", e)
    return NextResponse.json({ error: "No se pudieron obtener los leads" }, { status: 500 })
  }
}

