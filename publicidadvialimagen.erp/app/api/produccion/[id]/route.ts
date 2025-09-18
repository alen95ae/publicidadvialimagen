import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const production = await prisma.production.findUnique({
      where: { id: params.id }
    })

    if (!production) {
      return NextResponse.json(
        { error: "Orden de producción no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(production)
  } catch (error) {
    console.error("Error fetching production:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json()
    
    // Verificar que la orden existe
    const existingProduction = await prisma.production.findUnique({
      where: { id: params.id }
    })

    if (!existingProduction) {
      return NextResponse.json(
        { error: "Orden de producción no encontrada" },
        { status: 404 }
      )
    }

    // Actualizar orden de producción
    const production = await prisma.production.update({
      where: { id: params.id },
      data: {
        codigo: data.codigo,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        lugarInstalacion: data.lugarInstalacion,
        equipoTrabajo: data.equipoTrabajo,
        responsable: data.responsable,
        tiempoEjecucion: data.tiempoEjecucion,
        fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
        estado: data.estado,
        notas: data.notas
      }
    })

    return NextResponse.json(production)
  } catch (error) {
    console.error("Error updating production:", error)
    
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la orden existe
    const existingProduction = await prisma.production.findUnique({
      where: { id: params.id }
    })

    if (!existingProduction) {
      return NextResponse.json(
        { error: "Orden de producción no encontrada" },
        { status: 404 }
      )
    }

    // Eliminar orden de producción
    await prisma.production.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Orden de producción eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting production:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
