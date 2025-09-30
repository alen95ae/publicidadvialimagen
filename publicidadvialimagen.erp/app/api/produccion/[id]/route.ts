import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implementar cuando se cree la tabla de producción en Supabase
    return NextResponse.json(
      { error: "Módulo de producción no disponible temporalmente" },
      { status: 501 }
    )
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
    // TODO: Implementar cuando se cree la tabla de producción en Supabase
    return NextResponse.json(
      { error: "Módulo de producción no disponible temporalmente" },
      { status: 501 }
    )
  } catch (error) {
    console.error("Error updating production:", error)
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
    // TODO: Implementar cuando se cree la tabla de producción en Supabase
    return NextResponse.json(
      { error: "Módulo de producción no disponible temporalmente" },
      { status: 501 }
    )
  } catch (error) {
    console.error("Error deleting production:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
