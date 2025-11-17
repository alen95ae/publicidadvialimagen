import { NextResponse } from "next/server"
import { findContactoById, updateContacto, deleteContacto, type Contacto } from "@/lib/supabaseContactos"

// GET - Obtener un contacto por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de contacto requerido" },
        { status: 400 }
      )
    }

    const contact = await findContactoById(id)

    if (!contact) {
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error: any) {
    console.error("❌ Error obteniendo contacto:", error.message)
    return NextResponse.json(
      { 
        error: "No se pudo obtener el contacto",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un contacto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de contacto requerido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(`📝 PUT /api/contactos/${id} - Body recibido:`, Object.keys(body))

    // Mapear address1 a address si viene del frontend
    const dataToUpdate: Partial<Contacto> = { ...body }
    if (body.address1 !== undefined) {
      dataToUpdate.address = body.address1
      delete (dataToUpdate as any).address1
    }

    // Pasar el body directamente a updateContacto, que usará contactoToSupabase para mapear correctamente
    const updated = await updateContacto(id, dataToUpdate)

    if (!updated) {
      console.log(`⚠️ PUT /api/contactos/${id} - Contacto no encontrado o no se pudo actualizar`)
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    console.log(`✅ PUT /api/contactos/${id} - Contacto actualizado correctamente`)
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error(`❌ Error actualizando contacto ${id}:`, error.message)
    return NextResponse.json(
      { 
        error: "Error actualizando contacto",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// PATCH - Actualización parcial de un contacto
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de contacto requerido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(`📝 PATCH /api/contactos/${id} - Body recibido:`, Object.keys(body))

    // Mapear address1 a address si viene del frontend
    const dataToUpdate: Partial<Contacto> = { ...body }
    if (body.address1 !== undefined) {
      dataToUpdate.address = body.address1
      delete (dataToUpdate as any).address1
    }

    // Pasar el body directamente a updateContacto, que usará contactoToSupabase para mapear correctamente
    const updated = await updateContacto(id, dataToUpdate)

    if (!updated) {
      console.log(`⚠️ PATCH /api/contactos/${id} - Contacto no encontrado o no se pudo actualizar`)
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    console.log(`✅ PATCH /api/contactos/${id} - Contacto actualizado correctamente`)
    return NextResponse.json({ success: true, id: updated.id })
  } catch (error: any) {
    console.error(`❌ Error actualizando contacto ${id} (PATCH):`, error.message)
    return NextResponse.json(
      { 
        error: "No se pudo actualizar el contacto",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un contacto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Manejar tanto Next.js 15 (Promise) como versiones anteriores
    const { id } = params instanceof Promise ? await params : params

    if (!id) {
      return NextResponse.json(
        { error: "ID de contacto requerido" },
        { status: 400 }
      )
    }

    const eliminado = await deleteContacto(id)

    if (!eliminado) {
      return NextResponse.json(
        { error: "No se encontró el contacto o no se pudo eliminar" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Error eliminando contacto:", error.message)
    return NextResponse.json(
      { 
        error: "No se pudo eliminar el contacto",
        details: error.message 
      },
      { status: 500 }
    )
  }
}
