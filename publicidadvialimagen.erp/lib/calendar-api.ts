import { airtable } from "./airtable"

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
 * Obtiene todos los eventos del calendario desde Airtable
 */
export async function getEvents(): Promise<CalendarEvent[]> {
  try {
    const records = await airtable("Eventos")
      .select({
        view: "Grid view",
      })
      .all()

    return records.map((record) => ({
      id: record.id,
      title: record.get("Titulo") as string || "Sin título",
      description: record.get("Descripcion") as string,
      start: new Date(record.get("FechaInicio") as string),
      end: new Date(record.get("FechaFin") as string),
      assignedTo: record.get("AsignadoA") as string,
      assignedToName: record.get("NombreAsignado") as string,
      status: (record.get("Estado") as string || "pendiente") as CalendarEvent["status"],
      userId: record.get("UserId") as string,
    }))
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

/**
 * Obtiene eventos filtrados por usuario
 */
export async function getEventsByUser(userId: string): Promise<CalendarEvent[]> {
  try {
    const records = await airtable("Eventos")
      .select({
        view: "Grid view",
        filterByFormula: `{UserId} = '${userId}'`,
      })
      .all()

    return records.map((record) => ({
      id: record.id,
      title: record.get("Titulo") as string || "Sin título",
      description: record.get("Descripcion") as string,
      start: new Date(record.get("FechaInicio") as string),
      end: new Date(record.get("FechaFin") as string),
      assignedTo: record.get("AsignadoA") as string,
      assignedToName: record.get("NombreAsignado") as string,
      status: (record.get("Estado") as string || "pendiente") as CalendarEvent["status"],
      userId: record.get("UserId") as string,
    }))
  } catch (error) {
    console.error("Error fetching user events:", error)
    return []
  }
}

/**
 * Obtiene eventos de un día específico
 */
export async function getEventsByDate(date: Date, userId?: string): Promise<CalendarEvent[]> {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const allEvents = userId ? await getEventsByUser(userId) : await getEvents()
    
    return allEvents.filter(event => {
      const eventStart = new Date(event.start)
      return eventStart >= startOfDay && eventStart <= endOfDay
    })
  } catch (error) {
    console.error("Error fetching events by date:", error)
    return []
  }
}

/**
 * Crea un nuevo evento en Airtable
 */
export async function addEvent(eventData: EventFormData & { userId?: string }): Promise<CalendarEvent | null> {
  try {
    const records = await airtable("Eventos").create([
      {
        fields: {
          Titulo: eventData.title,
          Descripcion: eventData.description || "",
          FechaInicio: eventData.start.toISOString(),
          FechaFin: eventData.end.toISOString(),
          AsignadoA: eventData.assignedTo,
          Estado: eventData.status,
          UserId: eventData.userId || "",
        },
      },
    ])

    const record = records[0]
    return {
      id: record.id,
      title: record.get("Titulo") as string,
      description: record.get("Descripcion") as string,
      start: new Date(record.get("FechaInicio") as string),
      end: new Date(record.get("FechaFin") as string),
      assignedTo: record.get("AsignadoA") as string,
      assignedToName: record.get("NombreAsignado") as string,
      status: record.get("Estado") as CalendarEvent["status"],
      userId: record.get("UserId") as string,
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
    const fields: any = {}
    
    if (eventData.title) fields.Titulo = eventData.title
    if (eventData.description !== undefined) fields.Descripcion = eventData.description
    if (eventData.start) fields.FechaInicio = eventData.start.toISOString()
    if (eventData.end) fields.FechaFin = eventData.end.toISOString()
    if (eventData.assignedTo) fields.AsignadoA = eventData.assignedTo
    if (eventData.status) fields.Estado = eventData.status

    const records = await airtable("Eventos").update([
      {
        id: eventId,
        fields,
      },
    ])

    const record = records[0]
    return {
      id: record.id,
      title: record.get("Titulo") as string,
      description: record.get("Descripcion") as string,
      start: new Date(record.get("FechaInicio") as string),
      end: new Date(record.get("FechaFin") as string),
      assignedTo: record.get("AsignadoA") as string,
      assignedToName: record.get("NombreAsignado") as string,
      status: record.get("Estado") as CalendarEvent["status"],
      userId: record.get("UserId") as string,
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
    await airtable("Eventos").destroy([eventId])
    return true
  } catch (error) {
    console.error("Error deleting event:", error)
    return false
  }
}

/**
 * Obtiene la lista de empleados para asignar eventos
 */
export async function getEmployees(): Promise<Array<{ id: string; name: string; email?: string }>> {
  try {
    const records = await airtable("Empleados")
      .select({
        view: "Grid view",
      })
      .all()

    return records.map((record) => ({
      id: record.id,
      name: record.get("Nombre") as string || "Sin nombre",
      email: record.get("Email") as string,
    }))
  } catch (error) {
    console.error("Error fetching employees:", error)
    // Retornar lista vacía si falla o si la tabla no existe
    return []
  }
}

