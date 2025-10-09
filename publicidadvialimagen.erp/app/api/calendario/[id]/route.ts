import { NextRequest, NextResponse } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { updateEvent, deleteEvent } from "@/lib/calendar-api"

// PUT - Actualizar un evento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isAuthenticated } = getKindeServerSession()
    const authed = await isAuthenticated()
    
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const event = await updateEvent(params.id, body)
    
    if (!event) {
      return NextResponse.json({ error: "Error updating event" }, { status: 500 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Error updating event" }, { status: 500 })
  }
}

// DELETE - Eliminar un evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isAuthenticated } = getKindeServerSession()
    const authed = await isAuthenticated()
    
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await deleteEvent(params.id)
    
    if (!success) {
      return NextResponse.json({ error: "Error deleting event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Error deleting event" }, { status: 500 })
  }
}

