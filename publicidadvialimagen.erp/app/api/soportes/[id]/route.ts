import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { buildSupabasePayload, ensureDefaultOwnerId, supabaseRowToSupport } from "../helpers"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data, error } = await supabaseServer
      .from('soportes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Soporte no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(supabaseRowToSupport(data))
  } catch (error) {
    console.error("Error fetching support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()

    if (!data.code || !data.title) {
      return NextResponse.json(
        { error: "Código y título son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el soporte existe
    const { data: existing, error: existingError } = await supabaseServer
      .from('soportes')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: "Soporte no encontrado" },
        { status: 404 }
      )
    }

    // Actualizar en Supabase
    const payload = buildSupabasePayload(data, existing)

    const { data: updated, error } = await supabaseServer
      .from('soportes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !updated) {
      console.error('Error updating support in Supabase:', error)
      return NextResponse.json({ error: 'Error actualizando soporte' }, { status: 500 })
    }

    return NextResponse.json(supabaseRowToSupport(updated))
  } catch (error) {
    console.error("Error updating support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Verificar que el soporte existe
    const { data: existing, error: fetchError } = await supabaseServer
      .from('soportes')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Soporte no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar de Supabase
    const { error } = await supabaseServer
      .from('soportes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting support in Supabase:', error)
      return NextResponse.json({ error: 'Error eliminando soporte' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting support:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
