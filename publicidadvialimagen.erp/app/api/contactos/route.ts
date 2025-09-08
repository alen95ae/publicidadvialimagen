import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const relation = searchParams.get("relation")
    const city = searchParams.get("city")
    const country = searchParams.get("country")
    const owner = searchParams.get("owner")
    const favorite = searchParams.get("favorite")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    // Construir filtros
    const where: any = {
      isActive: true
    }

    // Búsqueda de texto
    if (q) {
      where.OR = [
        { displayName: { contains: q } },
        { legalName: { contains: q } },
        { taxId: { contains: q } },
        { email: { contains: q } },
        { city: { contains: q } },
        { country: { contains: q } }
      ]
    }

    // Filtros específicos
    if (relation) {
      where.relation = relation
    }

    if (city) {
      where.city = city
    }

    if (country) {
      where.country = country
    }

    if (owner) {
      where.salesOwnerId = owner
    }

    if (favorite === "true") {
      where.favorite = true
    }

    // Contar total
    const total = await prisma.contact.count({ where })

    // Obtener contactos con paginación
    const contacts = await prisma.contact.findMany({
      where,
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
      },
      orderBy: [
        { favorite: "desc" },
        { displayName: "asc" }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return NextResponse.json({
      items: contacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
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
    if (!data.displayName) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      )
    }

    // Crear contacto
    const contact = await prisma.contact.create({
      data: {
        kind: data.kind || "COMPANY",
        relation: data.relation || "CUSTOMER",
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
        favorite: data.favorite || false,
        isActive: data.isActive !== false
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

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
