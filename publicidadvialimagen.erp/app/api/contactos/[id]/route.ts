import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data: contact, error } = await supabaseServer
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !contact) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
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
    
    // Validación básica
    if (!data.nombre_comercial) {
      return NextResponse.json(
        { error: "Nombre comercial es requerido" },
        { status: 400 }
      )
    }

    // Actualizar cliente en Supabase
    const { data: contact, error } = await supabaseServer
      .from('clientes')
      .update({
        nombre_comercial: data.nombre_comercial,
        nombre_contacto: data.nombre_contacto,
        email: data.email,
        telefono: data.telefono,
        cif_nif: data.cif_nif,
        direccion: data.direccion,
        ciudad: data.ciudad,
        codigo_postal: data.codigo_postal,
        pais: data.pais,
        tipo_cliente: data.tipo_cliente,
        estado: data.estado,
        notas: data.notas
      })
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error updating client in Supabase:', error)
      return NextResponse.json({ error: 'Error actualizando cliente' }, { status: 500 })
    }
    
    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Soft delete - marcar como inactivo
    const { error } = await supabaseServer
      .from('clientes')
      .update({ estado: 'inactivo' })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating client status in Supabase:', error)
      return NextResponse.json({ error: 'Error actualizando estado del cliente' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    
    // Actualización parcial
    const { data: contact, error } = await supabaseServer
      .from('clientes')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error updating client in Supabase:', error)
      return NextResponse.json({ error: 'Error actualizando cliente' }, { status: 500 })
    }
    
    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
