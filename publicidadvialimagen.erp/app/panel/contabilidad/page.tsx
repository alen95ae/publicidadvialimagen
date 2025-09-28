"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/sidebar"
import { 
  Receipt, 
  DollarSign, 
  FileText, 
  TrendingUp,
  BarChart3,
  Calculator,
  Home
} from "lucide-react"

const contabilidadModules = [
  {
    key: "facturas",
    title: "Facturas",
    description: "Gestiona las facturas emitidas y recibidas",
    href: "/panel/contabilidad/facturas",
    icon: FileText,
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    key: "presupuestos",
    title: "Presupuestos",
    description: "Crea y gestiona presupuestos para clientes",
    href: "/panel/contabilidad/presupuestos",
    icon: Calculator,
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    key: "reportes",
    title: "Reportes Financieros",
    description: "Genera reportes de ingresos y gastos",
    href: "/panel/contabilidad/reportes",
    icon: BarChart3,
    color: "bg-purple-500 hover:bg-purple-600"
  }
]

export default function ContabilidadPage() {
  return (
    <Sidebar>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/panel" 
              className="bg-[#D54644] hover:bg-[#D54644]/90 text-white p-2 rounded-lg transition-colors"
              title="Volver al panel de control"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-[#D54644]" />
              <div className="text-xl font-bold text-slate-800">Contabilidad</div>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Módulo de Contabilidad</h1>
          <p className="text-gray-600">Gestiona toda la información financiera y contable de la empresa</p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contabilidadModules.map((module) => {
            const IconComponent = module.icon
            return (
              <div key={module.key}>
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
              </div>
            )
          })}
        </div>

        {/* Statistics Cards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Resumen Financiero</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-green-600">€45,230</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gastos del Mes</p>
                    <p className="text-2xl font-bold text-red-600">€12,450</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Facturas Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600">8</p>
                  </div>
                  <Receipt className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Beneficio Neto</p>
                    <p className="text-2xl font-bold text-blue-600">€32,780</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </Sidebar>
  )
}
