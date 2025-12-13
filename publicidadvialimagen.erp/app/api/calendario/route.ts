import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"
import { getEvents, addEvent, EventFormData } from "@/lib/calendar-api"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Obtener todos los eventos
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await verifySession(token)
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await getEvents()
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Error fetching events" }, { status: 500 })
  }
}

// POST - Crear un nuevo evento
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let user
    try {
      user = await verifySession(token)
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    const eventData: EventFormData & { userId?: string } = {
      ...body,
      userId: user?.sub,
    }

    const event = await addEvent(eventData)
    
    if (!event) {
      return NextResponse.json({ error: "Error creating event" }, { status: 500 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Error creating event" }, { status: 500 })
  }
}

