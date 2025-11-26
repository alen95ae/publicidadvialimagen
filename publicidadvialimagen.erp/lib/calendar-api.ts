// Calendar API - Migrado a Supabase (pendiente de implementación)

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
  // TODO: Implementar con Supabase cuando se migre la tabla de eventos
  console.warn("Calendar events not yet migrated to Supabase, returning empty events")
  return []
}

/**
 * Obtiene eventos filtrados por usuario
 */
export async function getEventsByUser(userId: string): Promise<CalendarEvent[]> {
  // TODO: Implementar con Supabase cuando se migre la tabla de eventos
  console.warn("Calendar events not yet migrated to Supabase, returning empty events")
  return []
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
    // Retornar array vacío en lugar de lanzar error
    return []
  }
}

/**
 * Crea un nuevo evento en Airtable
 */
export async function addEvent(eventData: EventFormData & { userId?: string }): Promise<CalendarEvent | null> {
  // TODO: Implementar con Supabase cuando se migre la tabla de eventos
  console.warn("Calendar events not yet migrated to Supabase, cannot create event")
  return null
}

/**
 * Actualiza un evento existente
 */
export async function updateEvent(
  eventId: string,
  eventData: Partial<EventFormData>
): Promise<CalendarEvent | null> {
  // TODO: Implementar con Supabase cuando se migre la tabla de eventos
  console.warn("Calendar events not yet migrated to Supabase, cannot update event")
  return null
}

/**
 * Elimina un evento
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  // TODO: Implementar con Supabase cuando se migre la tabla de eventos
  console.warn("Calendar events not yet migrated to Supabase, cannot delete event")
  return false
}

/**
 * Obtiene la lista de empleados para asignar eventos
 */
export async function getEmployees(): Promise<Array<{ id: string; name: string; email?: string }>> {
  // TODO: Implementar con Supabase cuando se migre la tabla de empleados
  // Por ahora, obtener empleados desde la tabla de usuarios
  try {
    const { getSupabaseServer } = await import('./supabaseServer')
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email')
      .eq('activo', true)
    
    if (error) {
      console.error("Error fetching employees:", error)
      return []
    }
    
    return (data || []).map((user: any) => ({
      id: user.id,
      name: user.nombre || "Sin nombre",
      email: user.email || undefined,
    }))
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

