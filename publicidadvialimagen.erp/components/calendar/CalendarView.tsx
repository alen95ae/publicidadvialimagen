"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Calendar as BigCalendar, momentLocalizer, View, Event } from "react-big-calendar"
import moment from "moment"
import "moment/locale/es"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { CalendarEvent, addEvent, updateEvent, deleteEvent, getEmployees, EventFormData } from "@/lib/calendar-client"
import EventCard from "./EventCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

moment.locale("es")
const localizer = momentLocalizer(moment)

interface CalendarViewProps {
  events: CalendarEvent[]
  onRefresh: () => void
  userId?: string
}

interface EventDialogData {
  title: string
  description: string
  start: Date
  end: Date
  assignedTo: string
  status: "pendiente" | "en_curso" | "completado"
}

const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay eventos en este rango",
  showMore: (total: number) => `+ ${total} más`,
}

export default function CalendarView({ events, onRefresh, userId }: CalendarViewProps) {
  const [view, setView] = useState<View>("month")
  const [date, setDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isViewingEvent, setIsViewingEvent] = useState(false)
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState<EventDialogData>({
    title: "",
    description: "",
    start: new Date(),
    end: new Date(Date.now() + 3600000), // +1 hour
    assignedTo: "",
    status: "pendiente",
  })

  // Cargar empleados
  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  // Convertir eventos para react-big-calendar
  const calendarEvents: Event[] = useMemo(
    () =>
      events.map((event) => ({
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        resource: event,
      })),
    [events]
  )

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setFormData({
      title: "",
      description: "",
      start: slotInfo.start,
      end: slotInfo.end,
      assignedTo: "",
      status: "pendiente",
    })
    setSelectedEvent(null)
    setIsViewingEvent(false)
    setIsDialogOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event: Event) => {
    const calEvent = event.resource as CalendarEvent
    setSelectedEvent(calEvent)
    setFormData({
      title: calEvent.title,
      description: calEvent.description || "",
      start: new Date(calEvent.start),
      end: new Date(calEvent.end),
      assignedTo: calEvent.assignedTo,
      status: calEvent.status,
    })
    setIsViewingEvent(true)
    setIsDialogOpen(true)
  }, [])

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive",
      })
      return
    }

    const eventData: EventFormData & { userId?: string } = {
      ...formData,
      userId,
    }

    let success = false
    if (selectedEvent) {
      // Actualizar evento existente
      const result = await updateEvent(selectedEvent.id, formData)
      success = !!result
    } else {
      // Crear nuevo evento
      const result = await addEvent(eventData)
      success = !!result
    }

    if (success) {
      toast({
        title: "Éxito",
        description: selectedEvent ? "Evento actualizado correctamente" : "Evento creado correctamente",
      })
      setIsDialogOpen(false)
      resetForm()
      onRefresh()
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el evento",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    const success = await deleteEvent(selectedEvent.id)
    if (success) {
      toast({
        title: "Éxito",
        description: "Evento eliminado correctamente",
      })
      setIsDialogOpen(false)
      resetForm()
      onRefresh()
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start: new Date(),
      end: new Date(Date.now() + 3600000),
      assignedTo: "",
      status: "pendiente",
    })
    setSelectedEvent(null)
    setIsViewingEvent(false)
  }

  const eventStyleGetter = (event: Event) => {
    const calEvent = event.resource as CalendarEvent
    let backgroundColor = "#6B7280" // gray-500
    let borderColor = "#4B5563" // gray-600

    switch (calEvent.status) {
      case "pendiente":
        backgroundColor = "#9CA3AF"
        borderColor = "#6B7280"
        break
      case "en_curso":
        backgroundColor = "#3B82F6"
        borderColor = "#2563EB"
        break
      case "completado":
        backgroundColor = "#10B981"
        borderColor = "#059669"
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: "6px",
        border: "2px solid " + borderColor,
        color: "white",
        fontSize: "13px",
        padding: "2px 6px",
      },
    }
  }

  const dayPropGetter = (date: Date) => {
    const today = new Date()
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    const isWeekend = date.getDay() === 0 || date.getDay() === 6

    return {
      style: {
        backgroundColor: isToday ? "#FEF3F2" : isWeekend && view === "week" ? "#F9FAFB" : "white",
      },
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar personalizado */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date)
              if (view === "month") {
                newDate.setMonth(newDate.getMonth() - 1)
              } else if (view === "week") {
                newDate.setDate(newDate.getDate() - 7)
              } else {
                newDate.setDate(newDate.getDate() - 1)
              }
              setDate(newDate)
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setDate(new Date())}
          >
            Hoy
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date)
              if (view === "month") {
                newDate.setMonth(newDate.getMonth() + 1)
              } else if (view === "week") {
                newDate.setDate(newDate.getDate() + 7)
              } else {
                newDate.setDate(newDate.getDate() + 1)
              }
              setDate(newDate)
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 ml-4">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {format(date, view === "month" ? "MMMM yyyy" : "d 'de' MMMM, yyyy", { locale: es })}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("day")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                view === "day"
                  ? "bg-[#D54644] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Día
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-x border-gray-300",
                view === "week"
                  ? "bg-[#D54644] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Semana
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                view === "month"
                  ? "bg-[#D54644] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Mes
            </button>
          </div>

          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
            className="bg-[#D54644] hover:bg-[#B93D3B] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Evento
          </Button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: 700 }}>
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          messages={messages}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          style={{ height: "100%" }}
          popup
        />
      </div>

      {/* Dialog para crear/editar evento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isViewingEvent ? (selectedEvent ? "Ver / Editar Evento" : "Evento") : "Nuevo Evento"}
            </DialogTitle>
            <DialogDescription>
              {isViewingEvent
                ? "Visualiza o modifica los detalles del evento"
                : "Completa los detalles del nuevo evento"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título del evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Fecha y hora de inicio</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      start: new Date(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">Fecha y hora de fin</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={format(formData.end, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      end: new Date(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Asignado a</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "pendiente" | "en_curso" | "completado") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_curso">En Curso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedEvent && (
              <Button variant="destructive" onClick={handleDeleteEvent}>
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent} className="bg-[#D54644] hover:bg-[#B93D3B]">
              {selectedEvent ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

