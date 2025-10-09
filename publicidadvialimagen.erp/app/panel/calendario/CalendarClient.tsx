"use client"

import { useState } from "react"
import CalendarView from "@/components/calendar/CalendarView"
import { CalendarEvent, getEvents } from "@/lib/calendar-client"

interface CalendarClientProps {
  initialEvents: CalendarEvent[]
  userId?: string
}

export default function CalendarClient({ initialEvents, userId }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  const handleRefresh = async () => {
    const updatedEvents = await getEvents()
    setEvents(updatedEvents)
  }

  return <CalendarView events={events} onRefresh={handleRefresh} userId={userId} />
}

