import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // TODO: Implementar cuando se cree la tabla de producción en Supabase
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0
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
    // TODO: Implementar cuando se cree la tabla de producción en Supabase
    return NextResponse.json(
      { error: "Módulo de producción no disponible temporalmente" },
      { status: 501 }
    )
  } catch (error) {
    console.error("Error creating production:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
