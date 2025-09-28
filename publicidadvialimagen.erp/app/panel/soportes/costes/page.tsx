"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Monitor, 
  ArrowLeft, 
  DollarSign, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Home,
  Calendar
} from "lucide-react"
import Sidebar from "@/components/sidebar"

// Datos de ejemplo para los costes de soportes
const soportesCostes = [
  {
    id: "1",
    codigo: "SM-001",
    titulo: "Valla Av. Pando",
    propietario: "Imagen",
    costeMensual: 500.00,
    luz: 120.00,
    patentes: 80.00,
    comision: 50.00,
    otros: 30.00,
    costoTotal: 780.00,
    precioVenta: 1200.00,
    porcentajeBeneficio: 53.85
  },
  {
    id: "2",
    codigo: "SM-002", 
    titulo: "Pantalla Centro",
    propietario: "Externa",
    costeMensual: 800.00,
    luz: 200.00,
    patentes: 120.00,
    comision: 80.00,
    otros: 50.00,
    costoTotal: 1250.00,
    precioVenta: 1800.00,
    porcentajeBeneficio: 44.00
  },
  {
    id: "3",
    codigo: "SM-003",
    titulo: "Totem Norte",
    propietario: "Imagen",
    costeMensual: 300.00,
    luz: 80.00,
    patentes: 60.00,
    comision: 30.00,
    otros: 20.00,
    costoTotal: 490.00,
    precioVenta: 750.00,
    porcentajeBeneficio: 53.06
  },
  {
    id: "4",
    codigo: "SM-004",
    titulo: "Mural Sur",
    propietario: "Externa",
    costeMensual: 400.00,
    luz: 100.00,
    patentes: 70.00,
    comision: 40.00,
    otros: 25.00,
    costoTotal: 635.00,
    precioVenta: 950.00,
    porcentajeBeneficio: 49.61
  },
  {
    id: "5",
    codigo: "SM-005",
    titulo: "Parada Bus Este",
    propietario: "Imagen",
    costeMensual: 200.00,
    luz: 50.00,
    patentes: 40.00,
    comision: 20.00,
    otros: 15.00,
    costoTotal: 325.00,
    precioVenta: 500.00,
    porcentajeBeneficio: 53.85
  }
]

const getBeneficioColor = (porcentaje: number) => {
  if (porcentaje >= 50) return "text-green-600"
  if (porcentaje >= 30) return "text-yellow-600"
  return "text-red-600"
}

const getBeneficioIcon = (porcentaje: number) => {
  if (porcentaje >= 50) return <TrendingUp className="w-4 h-4" />
  if (porcentaje >= 30) return <TrendingUp className="w-4 h-4" />
  return <TrendingDown className="w-4 h-4" />
}

export default function CostesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSoportes, setSelectedSoportes] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSoportes(soportesCostes.map(s => s.id))
    } else {
      setSelectedSoportes([])
    }
  }

  const handleSelectSoporte = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSoportes([...selectedSoportes, id])
    } else {
      setSelectedSoportes(selectedSoportes.filter(s => s !== id))
    }
  }

  const filteredSoportes = soportesCostes.filter(soporte =>
    soporte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soporte.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    soporte.propietario.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCostos = soportesCostes.reduce((sum, soporte) => sum + soporte.costoTotal, 0)
  const totalVentas = soportesCostes.reduce((sum, soporte) => sum + soporte.precioVenta, 0)
  const beneficioTotal = totalVentas - totalCostos
  const porcentajeBeneficioTotal = (beneficioTotal / totalCostos) * 100

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
            <div className="text-xl font-bold text-slate-800">Soportes</div>
            <div className="flex items-center gap-6 ml-4">
              <Link 
                href="/panel/soportes/gestion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Soportes
              </Link>
              <Link 
                href="/panel/soportes/costes" 
                className="text-sm font-medium text-[#D54644] hover:text-[#D54644]/80 transition-colors"
              >
                Costes
              </Link>
              <Link 
                href="/panel/soportes/planificacion" 
                className="text-sm font-medium text-gray-600 hover:text-[#D54644] transition-colors"
              >
                Planificación
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Buscar</span>
            <span className="text-gray-800 font-medium">admin</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Costes</h1>
          <p className="text-gray-600">Controla los costes y rentabilidad de los soportes publicitarios</p>
        </div>

        {/* Resumen de Costes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Costos</p>
                  <p className="text-2xl font-bold text-red-600">
                    €{totalCostos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{totalVentas.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Beneficio Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{beneficioTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">% Beneficio</p>
                  <p className={`text-2xl font-bold ${getBeneficioColor(porcentajeBeneficioTotal)}`}>
                    {porcentajeBeneficioTotal.toFixed(1)}%
                  </p>
                </div>
                {getBeneficioIcon(porcentajeBeneficioTotal)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar soportes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Coste
              </Button>
            </div>
          </div>
        </div>

        {/* Tabla de Costes */}
        <Card>
          <CardHeader>
            <CardTitle>Costes por Soporte</CardTitle>
            <CardDescription>
              {filteredSoportes.length} soportes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedSoportes.length === soportesCostes.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Propietario</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Coste Mensual</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Luz</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Patentes</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Comisión</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Otros</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Costo Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Precio Venta</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">% Beneficio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSoportes.map((soporte) => (
                    <tr key={soporte.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedSoportes.includes(soporte.id)}
                          onCheckedChange={(checked) => handleSelectSoporte(soporte.id, checked as boolean)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#D54644]">{soporte.codigo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{soporte.titulo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={soporte.propietario === 'Imagen' ? 'bg-rose-900 text-white' : 'bg-sky-700 text-white'}>
                          {soporte.propietario}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">€{soporte.costeMensual.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>€{soporte.luz.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>€{soporte.patentes.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>€{soporte.comision.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>€{soporte.otros.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-red-600">€{soporte.costoTotal.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-green-600">€{soporte.precioVenta.toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-1 ${getBeneficioColor(soporte.porcentajeBeneficio)}`}>
                          {getBeneficioIcon(soporte.porcentajeBeneficio)}
                          <span className="font-medium">{soporte.porcentajeBeneficio.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </Sidebar>
  )
}
