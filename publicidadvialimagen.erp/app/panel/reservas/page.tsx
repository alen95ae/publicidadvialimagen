"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, Construction } from "lucide-react"

export default function ReservasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel" className="text-gray-600 hover:text-gray-800 mr-4">
              ← Panel
            </Link>
            <div className="text-xl font-bold text-slate-800">Reservas</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Reservas</h1>
          <p className="text-gray-600">Administra las reservas de soportes publicitarios</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Construction className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <CardTitle className="text-2xl">En Construcción</CardTitle>
            <CardDescription>
              El módulo de reservas estará disponible próximamente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Este módulo permitirá gestionar reservas, calendario de ocupación, 
              confirmaciones y seguimiento de campañas.
            </p>
            <Link href="/panel">
              <button className="bg-[#D54644] hover:bg-[#B03A38] text-white px-6 py-2 rounded-lg">
                Volver al Panel
              </button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
