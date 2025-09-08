"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Monitor, 
  ArrowLeft, 
  Settings, 
  DollarSign, 
  Calendar,
  BarChart3
} from "lucide-react"

const soportesModules = [
  {
    key: "gestion",
    title: "Gestión de Soportes",
    description: "Administra los soportes publicitarios disponibles",
    href: "/panel/soportes/gestion",
    icon: Settings,
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    key: "costes",
    title: "Costes",
    description: "Controla los costes y rentabilidad de los soportes",
    href: "/panel/soportes/costes",
    icon: DollarSign,
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    key: "planificacion",
    title: "Planificación",
    description: "Visualiza la planificación anual de soportes",
    href: "/panel/soportes/planificacion",
    icon: Calendar,
    color: "bg-purple-500 hover:bg-purple-600"
  }
]

export default function SoportesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/panel" className="text-gray-600 hover:text-gray-800 mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Monitor className="w-6 h-6 text-[#D54644]" />
              <div className="text-xl font-bold text-slate-800">Soportes</div>
            </div>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Módulo de Soportes</h1>
          <p className="text-gray-600">Gestiona todos los aspectos de tus soportes publicitarios</p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {soportesModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link key={module.key} href={module.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${module.color} flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{module.title}</CardTitle>
                    <CardDescription className="text-center">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button className="w-full">
                      Acceder
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Statistics Cards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Resumen General</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Soportes</p>
                    <p className="text-2xl font-bold text-slate-800">24</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disponibles</p>
                    <p className="text-2xl font-bold text-green-600">18</p>
                  </div>
                  <Settings className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ocupados</p>
                    <p className="text-2xl font-bold text-red-600">6</p>
                  </div>
                  <Monitor className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                    <p className="text-2xl font-bold text-purple-600">€12,450</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
