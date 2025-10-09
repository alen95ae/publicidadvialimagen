"use client"

import { CalendarEvent } from "@/lib/calendar-client"
import { Calendar, Clock, User, CheckCircle, Circle, Loader } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface EventCardProps {
  event: CalendarEvent
  onClick?: () => void
  compact?: boolean
}

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    icon: Circle,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  en_curso: {
    label: "En Curso",
    icon: Loader,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
  },
  completado: {
    label: "Completado",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
  },
}

export default function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const status = statusConfig[event.status] || statusConfig.pendiente
  const StatusIcon = status.icon

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "p-2 rounded border-l-4 cursor-pointer transition-all hover:shadow-sm",
          status.bgColor,
          status.borderColor,
          "border-l-4"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {format(new Date(event.start), "HH:mm", { locale: es })}
            </p>
          </div>
          <StatusIcon className={cn("w-4 h-4 flex-shrink-0", status.color)} />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
        status.bgColor,
        status.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">{event.title}</h3>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", status.bgColor)}>
          <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
          <span className={status.color}>{status.label}</span>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
      )}

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{format(new Date(event.start), "d 'de' MMMM, yyyy", { locale: es })}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>
            {format(new Date(event.start), "HH:mm", { locale: es })} -{" "}
            {format(new Date(event.end), "HH:mm", { locale: es })}
          </span>
        </div>

        {event.assignedToName && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4 text-gray-500" />
            <span>{event.assignedToName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

