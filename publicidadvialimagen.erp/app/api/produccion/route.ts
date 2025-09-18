import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || ""
    const estado = searchParams.get("estado")
    const responsable = searchParams.get("responsable")
    const equipoTrabajo = searchParams.get("equipoTrabajo")
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "50")

    // Construir filtros
    const where: any = {}

    // Búsqueda de texto
    if (q) {
      where.OR = [
        { codigo: { contains: q } },
        { lugarInstalacion: { contains: q } },
        { responsable: { contains: q } },
        { equipoTrabajo: { contains: q } },
        { notas: { contains: q } }
      ]
    }

    // Filtros específicos
    if (estado) {
      where.estado = estado
    }

    if (responsable) {
      where.responsable = responsable
    }

    if (equipoTrabajo) {
      where.equipoTrabajo = equipoTrabajo
    }

    // Contar total
    const total = await prisma.production.count({ where })

    // Obtener órdenes de producción con paginación
    const productions = await prisma.production.findMany({
      where,
      orderBy: [
        { fecha: "desc" },
        { createdAt: "desc" }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    return NextResponse.json({
      items: productions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error("Error fetching productions:", error)
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
    if (!data.codigo) {
      return NextResponse.json(
        { error: "Código es requerido" },
        { status: 400 }
      )
    }

    if (!data.fecha) {
      return NextResponse.json(
        { error: "Fecha es requerida" },
        { status: 400 }
      )
    }

    if (!data.lugarInstalacion) {
      return NextResponse.json(
        { error: "Lugar de instalación es requerido" },
        { status: 400 }
      )
    }

    if (!data.equipoTrabajo) {
      return NextResponse.json(
        { error: "Equipo de trabajo es requerido" },
        { status: 400 }
      )
    }

    if (!data.responsable) {
      return NextResponse.json(
        { error: "Responsable es requerido" },
        { status: 400 }
      )
    }

    if (!data.tiempoEjecucion) {
      return NextResponse.json(
        { error: "Tiempo de ejecución es requerido" },
        { status: 400 }
      )
    }

    if (!data.fechaLimite) {
      return NextResponse.json(
        { error: "Fecha límite es requerida" },
        { status: 400 }
      )
    }

    // Crear orden de producción
    const production = await prisma.production.create({
      data: {
        codigo: data.codigo,
        fecha: new Date(data.fecha),
        lugarInstalacion: data.lugarInstalacion,
        equipoTrabajo: data.equipoTrabajo,
        responsable: data.responsable,
        tiempoEjecucion: data.tiempoEjecucion,
        fechaLimite: new Date(data.fechaLimite),
        estado: data.estado || "PENDIENTE",
        notas: data.notas
      }
    })

    return NextResponse.json(production, { status: 201 })
  } catch (error) {
    console.error("Error creating production:", error)
    
    // Manejar error de código duplicado
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe una orden de producción con este código" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
