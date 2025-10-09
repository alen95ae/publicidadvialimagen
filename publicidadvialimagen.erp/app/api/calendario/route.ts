import { NextRequest, NextResponse } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getEvents, addEvent, EventFormData } from "@/lib/calendar-api"

// GET - Obtener todos los eventos
export async function GET() {
  try {
    const { isAuthenticated } = getKindeServerSession()
    const authed = await isAuthenticated()
    
    if (!authed) {
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
    const { isAuthenticated, getUser } = getKindeServerSession()
    const authed = await isAuthenticated()
    
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUser()
    const body = await request.json()
    
    const eventData: EventFormData & { userId?: string } = {
      ...body,
      userId: user?.id,
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

