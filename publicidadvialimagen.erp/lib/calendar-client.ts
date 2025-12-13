"use client"

/**
 * Cliente para API de calendario (solo para componentes del cliente)
 */

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  assignedTo: string
  assignedToName?: string
  status: "pendiente" | "en_curso" | "completado"
  userId?: string
}

export interface EventFormData {
  title: string
  description?: string
  start: Date
  end: Date
  assignedTo: string
  status: "pendiente" | "en_curso" | "completado"
}

/**
 * Obtiene todos los eventos del calendario
 */
export async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await fetch("/api/calendario", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error("Error fetching events")
    }

    const data = await response.json()
    // Convertir fechas string a Date objects
    return data.map((event: any) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }))
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

/**
 * Crea un nuevo evento
 */
export async function addEvent(eventData: EventFormData): Promise<CalendarEvent | null> {
  try {
    const response = await fetch("/api/calendario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
      cache: 'no-store',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error("Error creating event")
    }

    const data = await response.json()
    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
    }
  } catch (error) {
    console.error("Error creating event:", error)
    return null
  }
}

/**
 * Actualiza un evento existente
 */
export async function updateEvent(
  eventId: string,
  eventData: Partial<EventFormData>
): Promise<CalendarEvent | null> {
  try {
    const response = await fetch(`/api/calendario/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
      cache: 'no-store',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error("Error updating event")
    }

    const data = await response.json()
    return {
      ...data,
      start: new Date(data.start),
      end: new Date(data.end),
    }
  } catch (error) {
    console.error("Error updating event:", error)
    return null
  }
}

/**
 * Elimina un evento
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/calendario/${eventId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error("Error deleting event")
    }

    return true
  } catch (error) {
    console.error("Error deleting event:", error)
    return false
  }
}

/**
 * Obtiene la lista de empleados
 */
export async function getEmployees(): Promise<Array<{ id: string; name: string; email?: string }>> {
  try {
    const response = await fetch("/api/calendario/empleados", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error("Error fetching employees")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

