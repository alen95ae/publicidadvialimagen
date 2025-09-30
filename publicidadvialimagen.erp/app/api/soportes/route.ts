import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { buildSupabasePayload, ensureDefaultOwnerId, supabaseRowToSupport } from "./helpers"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const statuses = (searchParams.get('status') || '')
      .split(',').map(s => s.trim()).filter(Boolean)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit
    
    const statusFilters = statuses.map(status => status.toLowerCase())

    let query = supabaseServer
      .from('soportes')
      .select('*', { count: 'exact' })

    if (statusFilters.length) {
      query = query.in('Disponibilidad', statusFilters)
    }

    if (q) {
      const like = `%${q}%`
      query = query.or(`Codigo.ilike.${like},nombre.ilike.${like},Tipo.ilike.${like},Ciudad.ilike.${like}`)
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Error fetching supports from Supabase:', error)
      return NextResponse.json({ error: 'Error obteniendo soportes' }, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const supports = (data || []).map(supabaseRowToSupport)

    return NextResponse.json({
      data: supports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      }
    })
  } catch (error) {
    console.error("Error fetching supports:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Validación básica
    if (!data.code || !data.title) {
      return NextResponse.json(
        { error: "Código y título son requeridos" },
        { status: 400 }
      )
    }

    // Verificar si ya existe un soporte con el mismo código
    const { data: existing, error: existingError } = await supabaseServer
      .from('soportes')
      .select('*')
      .eq('Codigo', data.code)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing support:', existingError)
      return NextResponse.json({ error: 'Error verificando soporte existente' }, { status: 500 })
    }

    const payload = buildSupabasePayload(data)

    let result
    if (existing) {
      // Actualizar soporte existente
      const { data: updated, error: updateError } = await supabaseServer
        .from('soportes')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error updating support in Supabase:', updateError)
        return NextResponse.json({ error: 'Error actualizando soporte' }, { status: 500 })
      }
      result = updated
    } else {
      // Crear nuevo soporte
      const { data: inserted, error: insertError } = await supabaseServer
        .from('soportes')
        .insert([payload])
        .select('*')
        .single()

      if (insertError) {
        console.error('Error creating support in Supabase:', insertError)
        return NextResponse.json({ error: 'Error creando soporte' }, { status: 500 })
      }
      result = inserted
    }

    const support = supabaseRowToSupport(result)
    return NextResponse.json(support, { status: 201 })
  } catch (error) {
    console.error("Error creating support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
