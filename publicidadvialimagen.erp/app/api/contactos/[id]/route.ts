import { NextResponse } from "next/server"
import { findContactoById, updateContacto, deleteContacto } from "@/lib/supabaseContactos"

// GET - Obtener un contacto por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contact = await findContactoById(id)

    if (!contact) {
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json(
      { error: "No se pudo obtener el contacto" },
      { status: 404 }
    )
  }
}

// PUT - Actualizar un contacto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log('📝 Actualizando contacto:', id, body)

    const updateData: any = {}

    // Mapear todos los campos posibles
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.legalName !== undefined) {
      updateData.legalName = body.legalName
      updateData.company = body.legalName
    }
    if (body.company !== undefined) {
      updateData.company = body.company
      if (!updateData.legalName) {
        updateData.legalName = body.company
      }
    }
    if (body.kind !== undefined) updateData.kind = body.kind
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode
    if (body.country !== undefined) updateData.country = body.country
    if (body.relation !== undefined) updateData.relation = body.relation
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.website !== undefined) updateData.website = body.website

    // Actualizar el registro en Supabase
    const updated = await updateContacto(id, updateData)

    if (!updated) {
      return NextResponse.json(
        { error: "No se pudo actualizar el contacto" },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el contacto", details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Actualización parcial de un contacto
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    // Mapear solo los campos que vienen en el body
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.legalName !== undefined) {
      updateData.legalName = body.legalName
      updateData.company = body.legalName
    }
    if (body.company !== undefined) {
      updateData.company = body.company
      if (!updateData.legalName) {
        updateData.legalName = body.company
      }
    }
    if (body.kind !== undefined) updateData.kind = body.kind
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode
    if (body.country !== undefined) updateData.country = body.country
    if (body.relation !== undefined) updateData.relation = body.relation
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.website !== undefined) updateData.website = body.website

    // Actualizar el registro en Supabase
    const updated = await updateContacto(id, updateData)

    if (!updated) {
      return NextResponse.json(
        { error: "No se pudo actualizar el contacto" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error: any) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el contacto", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un contacto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const eliminado = await deleteContacto(id)

    if (!eliminado) {
      return NextResponse.json(
        { error: "No se encontró el contacto o no se pudo eliminar" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json(
      { error: "No se pudo eliminar el contacto" },
      { status: 500 }
    )
  }
}
