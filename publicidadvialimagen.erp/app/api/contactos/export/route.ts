import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const relation = searchParams.get("relation")
    const city = searchParams.get("city")
    const country = searchParams.get("country")
    const owner = searchParams.get("owner")
    const favorite = searchParams.get("favorite")

    // Construir filtros (igual que en la API principal)
    const where: any = {
      isActive: true
    }

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

    if (relation) where.relation = relation
    if (city) where.city = city
    if (country) where.country = country
    if (owner) where.salesOwnerId = owner
    if (favorite === "true") where.favorite = true

    // Obtener todos los contactos con filtros
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        salesOwner: {
          select: { name: true }
        }
      },
      orderBy: [
        { favorite: "desc" },
        { displayName: "asc" }
      ]
    })

    // Generar CSV
    const csvHeaders = [
      "Nombre",
      "Razón Social",
      "NIT",
      "Tipo",
      "Relación",
      "Teléfono",
      "Email",
      "Sitio Web",
      "Dirección 1",
      "Dirección 2",
      "Ciudad",
      "Estado",
      "Código Postal",
      "País",
      "Comercial",
      "Favorito",
      "Notas"
    ].join(",")

    const csvRows = contacts.map(contact => [
      `"${contact.displayName || ""}"`,
      `"${contact.legalName || ""}"`,
      `"${contact.taxId || ""}"`,
      `"${contact.kind === 'COMPANY' ? 'Compañía' : 'Individual'}"`,
      `"${contact.relation === 'CUSTOMER' ? 'Cliente' : contact.relation === 'SUPPLIER' ? 'Proveedor' : 'Ambos'}"`,
      `"${contact.phone || ""}"`,
      `"${contact.email || ""}"`,
      `"${contact.website || ""}"`,
      `"${contact.address1 || ""}"`,
      `"${contact.address2 || ""}"`,
      `"${contact.city || ""}"`,
      `"${contact.state || ""}"`,
      `"${contact.postalCode || ""}"`,
      `"${contact.country || ""}"`,
      `"${contact.salesOwner?.name || ""}"`,
      `"${contact.favorite ? 'Sí' : 'No'}"`,
      `"${(contact.notes || "").replace(/"/g, '""')}"`
    ].join(","))

    const csvContent = [csvHeaders, ...csvRows].join("\n")

    // Crear respuesta con headers para descarga
    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv; charset=utf-8")
    response.headers.set("Content-Disposition", `attachment; filename="contactos_${new Date().toISOString().split('T')[0]}.csv"`)
    
    return response
  } catch (error) {
    console.error("Error exporting contacts:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
