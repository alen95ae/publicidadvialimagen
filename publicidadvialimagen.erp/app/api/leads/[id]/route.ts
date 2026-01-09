import { NextResponse } from "next/server"
import { findLeadById, updateLead, deleteLead, type Lead } from "@/lib/supabaseLeads"
import { getSupabaseUser } from "@/lib/supabaseServer"
import { NextRequest } from "next/server"

// GET - Obtener un lead por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseUser(request as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de lead requerido" },
        { status: 400 }
      )
    }

    const lead = await findLeadById(id)

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error("❌ Error obteniendo lead:", error.message)
    return NextResponse.json(
      { 
        error: "No se pudo obtener el lead",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// PATCH - Actualización parcial de un lead
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseUser(request as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de lead requerido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(`📝 PATCH /api/leads/${id} - Body recibido:`, Object.keys(body))

    // Validar formato de email si se proporciona
    if (body.email !== undefined && body.email !== null && body.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "El formato del email no es válido" },
          { status: 400 }
        )
      }
    }

    // Pasar el body directamente a updateLead
    const updated = await updateLead(id, body)

    if (!updated) {
      console.log(`⚠️ PATCH /api/leads/${id} - Lead no encontrado o no se pudo actualizar`)
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      )
    }

    console.log(`✅ PATCH /api/leads/${id} - Lead actualizado correctamente`)
    return NextResponse.json({ success: true, id: updated.id })
  } catch (error: any) {
    console.error(`❌ Error actualizando lead ${id} (PATCH):`, error.message)
    return NextResponse.json(
      { 
        error: "No se pudo actualizar el lead",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un lead
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Verificar autenticación
    const supabase = await getSupabaseUser(request as NextRequest)
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de lead requerido" },
        { status: 400 }
      )
    }

    const eliminado = await deleteLead(id)

    if (!eliminado) {
      return NextResponse.json(
        { error: "No se encontró el lead o no se pudo eliminar" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Error eliminando lead:", error.message)
    return NextResponse.json(
      { 
        error: "No se pudo eliminar el lead",
        details: error.message 
      },
      { status: 500 }
    )
  }
}


