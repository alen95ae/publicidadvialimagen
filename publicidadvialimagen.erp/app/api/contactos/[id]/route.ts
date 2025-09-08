import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contact = await prisma.contact.findUnique({ 
      where: { id },
      include: {
        salesOwner: {
          select: { name: true, email: true }
        },
        tags: {
          include: {
            tag: {
              select: { name: true, color: true }
            }
          }
        }
      }
    })
    
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
    if (!data.displayName) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      )
    }

    // Actualizar contacto
    const contact = await prisma.contact.update({ 
      where: { id }, 
      data: {
        kind: data.kind,
        relation: data.relation,
        displayName: data.displayName,
        legalName: data.legalName,
        taxId: data.taxId,
        phone: data.phone,
        email: data.email,
        website: data.website,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        salesOwnerId: data.salesOwnerId,
        notes: data.notes,
        favorite: data.favorite,
        isActive: data.isActive
      },
      include: {
        salesOwner: {
          select: { name: true, email: true }
        },
        tags: {
          include: {
            tag: {
              select: { name: true, color: true }
            }
          }
        }
      }
    })
    
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
    await prisma.contact.update({
      where: { id },
      data: { isActive: false }
    })
    
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
    
    // Actualización parcial (para favoritos, etc.)
    const contact = await prisma.contact.update({ 
      where: { id }, 
      data,
      include: {
        salesOwner: {
          select: { name: true, email: true }
        },
        tags: {
          include: {
            tag: {
              select: { name: true, color: true }
            }
          }
        }
      }
    })
    
    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
