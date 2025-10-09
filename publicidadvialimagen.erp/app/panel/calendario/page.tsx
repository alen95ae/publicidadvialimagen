import { redirect } from "next/navigation"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import Sidebar from "@/components/sidebar"
import CalendarClient from "./CalendarClient"
import { getEvents, getEventsByDate } from "@/lib/calendar-api"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircle, Circle, Loader } from "lucide-react"

export default async function CalendarioPage() {
  const { isAuthenticated, getUser } = getKindeServerSession()
  const authed = await isAuthenticated()
  if (!authed) redirect("/login")

  const user = await getUser()
  const userId = user?.id

  // Obtener eventos
  const events = await getEvents()
  
  // Obtener eventos del día actual
  const today = new Date()
  const todayEvents = await getEventsByDate(today, userId)

  // Contar eventos por estado del día actual
  const pendingCount = todayEvents.filter((e) => e.status === "pendiente").length
  const inProgressCount = todayEvents.filter((e) => e.status === "en_curso").length
  const completedCount = todayEvents.filter((e) => e.status === "completado").length

  return (
    <Sidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendario de Tareas y Trabajos</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tus eventos, tareas y trabajos del día
            </p>
          </div>
        </div>

        {/* Resumen del día */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#D54644]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tareas de Hoy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{todayEvents.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#D54644] bg-opacity-10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#D54644]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-gray-500 mt-2">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Circle className="w-6 h-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Curso</p>
                  <p className="text-3xl font-bold text-blue-500 mt-2">{inProgressCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-3xl font-bold text-green-500 mt-2">{completedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendario */}
        <CalendarClient initialEvents={events} userId={userId} />
      </div>
    </Sidebar>
  )
}

