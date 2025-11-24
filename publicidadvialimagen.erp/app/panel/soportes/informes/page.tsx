"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PieChart, Calendar as CalendarIcon } from "lucide-react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

// Colores para los gráficos
const COLORS = [
  "#3b82f6", // azul
  "#ef4444", // rojo
  "#10b981", // verde
  "#f59e0b", // naranja
  "#8b5cf6", // morado
  "#ec4899", // rosa
  "#06b6d4", // cyan
  "#f97316", // naranja oscuro
  "#84cc16", // lima
  "#6366f1", // índigo
]

type TipoGrafico = 'vendedor' | 'cliente' | 'soporte' | 'ciudad' | 'estado'
type PeriodoFiltro = 'ultimo_mes' | 'ultimo_ano' | 'personalizado'

interface GraficoConfig {
  tipo: TipoGrafico
  titulo: string
  periodo: PeriodoFiltro
  fechaInicio?: Date
  fechaFin?: Date
  datos: { name: string; value: number }[]
  loading: boolean
}

export default function InformesPage() {
  const [añosDisponibles, setAñosDisponibles] = useState<number[]>([])
  const [mesesDisponibles] = useState([
    { value: 0, label: 'Enero' },
    { value: 1, label: 'Febrero' },
    { value: 2, label: 'Marzo' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Mayo' },
    { value: 5, label: 'Junio' },
    { value: 6, label: 'Julio' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Septiembre' },
    { value: 9, label: 'Octubre' },
    { value: 10, label: 'Noviembre' },
    { value: 11, label: 'Diciembre' },
  ])

  const [graficos, setGraficos] = useState<GraficoConfig[]>([
    {
      tipo: 'vendedor',
      titulo: 'Por Vendedor',
      periodo: 'ultimo_mes',
      datos: [],
      loading: false
    },
    {
      tipo: 'cliente',
      titulo: 'Por Cliente',
      periodo: 'ultimo_mes',
      datos: [],
      loading: false
    },
    {
      tipo: 'soporte',
      titulo: 'Por Soporte',
      periodo: 'ultimo_mes',
      datos: [],
      loading: false
    },
    {
      tipo: 'ciudad',
      titulo: 'Por Ciudad',
      periodo: 'ultimo_mes',
      datos: [],
      loading: false
    },
    {
      tipo: 'estado',
      titulo: 'Por Estado',
      periodo: 'ultimo_mes',
      datos: [],
      loading: false
    }
  ])

  // Calcular fechas para los períodos
  const getFechasPeriodo = (periodo: PeriodoFiltro): { inicio: Date; fin: Date } => {
    const hoy = new Date()
    const fin = new Date(hoy)
    fin.setHours(23, 59, 59, 999)

    switch (periodo) {
      case 'ultimo_mes':
        const inicioMes = new Date(hoy)
        inicioMes.setMonth(hoy.getMonth() - 1)
        inicioMes.setHours(0, 0, 0, 0)
        return { inicio: inicioMes, fin }
      
      case 'ultimo_ano':
        const inicioAno = new Date(hoy)
        inicioAno.setFullYear(hoy.getFullYear() - 1)
        inicioAno.setHours(0, 0, 0, 0)
        return { inicio: inicioAno, fin }
      
      case 'personalizado':
        // Se usan las fechas personalizadas del gráfico
        return { inicio: hoy, fin: hoy }
      
      default:
        return { inicio: hoy, fin: hoy }
    }
  }

  // Cargar datos de un gráfico
  const cargarDatosGrafico = async (index: number) => {
    const grafico = graficos[index]
    setGraficos(prev => {
      const nuevos = [...prev]
      nuevos[index].loading = true
      return nuevos
    })

    try {
      const params = new URLSearchParams()
      params.set('tipo', grafico.tipo)

      // Si es estado, no aplicar filtros de fecha
      if (grafico.tipo !== 'estado') {
        const { inicio, fin } = grafico.periodo === 'personalizado' && grafico.fechaInicio && grafico.fechaFin
          ? { inicio: grafico.fechaInicio, fin: grafico.fechaFin }
          : getFechasPeriodo(grafico.periodo)
        params.set('fecha_inicio', inicio.toISOString().split('T')[0])
        params.set('fecha_fin', fin.toISOString().split('T')[0])
      }

      const response = await fetch(`/api/soportes/informes?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setGraficos(prev => {
          const nuevos = [...prev]
          nuevos[index].datos = data.data || []
          nuevos[index].loading = false
          return nuevos
        })
      } else {
        throw new Error(data.error || 'Error al cargar datos')
      }
    } catch (error) {
      console.error(`Error cargando datos de ${grafico.tipo}:`, error)
      toast.error(`Error al cargar datos de ${grafico.titulo}`)
      setGraficos(prev => {
        const nuevos = [...prev]
        nuevos[index].loading = false
        return nuevos
      })
    }
  }

  // Cargar rango de fechas al montar
  useEffect(() => {
    const cargarRangoFechas = async () => {
      try {
        const response = await fetch('/api/soportes/informes?action=rango-fechas')
        const data = await response.json()
        
        if (data.success) {
          const fechaMinima = new Date(data.data.fechaMinima)
          const fechaMaxima = new Date(data.data.fechaMaxima)
          
          const añoMinimo = fechaMinima.getFullYear()
          const añoMaximo = fechaMaxima.getFullYear()
          
          // Generar array de años desde el mínimo al máximo
          const años: number[] = []
          for (let año = añoMinimo; año <= añoMaximo; año++) {
            años.push(año)
          }
          
          setAñosDisponibles(años)
        }
      } catch (error) {
        console.error('Error cargando rango de fechas:', error)
        // Si falla, usar años por defecto (últimos 5 años)
        const añoActual = new Date().getFullYear()
        setAñosDisponibles([añoActual - 4, añoActual - 3, añoActual - 2, añoActual - 1, añoActual])
      }
    }
    
    cargarRangoFechas()
  }, [])

  // Cargar todos los gráficos al montar
  useEffect(() => {
    graficos.forEach((_, index) => {
      cargarDatosGrafico(index)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Manejar cambio de período
  const handlePeriodoChange = (index: number, periodo: PeriodoFiltro) => {
    setGraficos(prev => {
      const nuevos = [...prev]
      nuevos[index].periodo = periodo
      if (periodo !== 'personalizado') {
        nuevos[index].fechaInicio = undefined
        nuevos[index].fechaFin = undefined
      }
      return nuevos
    })
    cargarDatosGrafico(index)
  }

  // Manejar cambio de fechas personalizadas
  const handleFechasChange = (index: number, fechaInicio: Date | undefined, fechaFin: Date | undefined) => {
    setGraficos(prev => {
      const nuevos = [...prev]
      nuevos[index].fechaInicio = fechaInicio
      nuevos[index].fechaFin = fechaFin
      return nuevos
    })
    if (fechaInicio && fechaFin) {
      cargarDatosGrafico(index)
    }
  }

  return (
    <div className="p-6">
      <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Informes y Estadísticas</h1>
          <p className="text-gray-600">Visualización de estadísticas de alquileres por diferentes criterios</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {graficos.map((grafico, index) => (
            <Card key={grafico.tipo}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <PieChart className="mr-2 h-5 w-5" />
                      {grafico.titulo}
                    </CardTitle>
                    <CardDescription>
                      {grafico.tipo === 'estado' 
                        ? 'Distribución de estados de soportes'
                        : `Distribución de alquileres ${grafico.titulo.toLowerCase()}`
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Controles de filtro - Ocultar para estado */}
                {grafico.tipo !== 'estado' && (
                  <div className="mb-4 space-y-2">
                    <Select
                      value={grafico.periodo}
                      onValueChange={(value) => handlePeriodoChange(index, value as PeriodoFiltro)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ultimo_mes">Último mes</SelectItem>
                        <SelectItem value="ultimo_ano">Último año</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>

                    {grafico.periodo === 'personalizado' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fecha de inicio</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-10"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {grafico.fechaInicio ? (
                                format(grafico.fechaInicio, "PPP", { locale: es })
                              ) : (
                                <span className="text-gray-500">Seleccionar fecha</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 shadow-lg border-gray-200" align="start">
                            <div className="p-4">
                              <Calendar
                                mode="single"
                                selected={grafico.fechaInicio}
                                onSelect={(date) => handleFechasChange(index, date, grafico.fechaFin)}
                                initialFocus
                                className="rounded-md"
                                captionLayout="dropdown"
                                fromYear={añosDisponibles.length > 0 ? añosDisponibles[0] : new Date().getFullYear() - 5}
                                toYear={añosDisponibles.length > 0 ? añosDisponibles[añosDisponibles.length - 1] : new Date().getFullYear()}
                                classNames={{
                                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                  month: "space-y-4",
                                  nav: "hidden",
                                  month_caption: "flex justify-center items-center text-base font-semibold mb-4 relative",
                                  caption_label: "text-gray-900",
                                  dropdowns: "flex items-center justify-center gap-3",
                                dropdown_root: "relative min-w-[100px]",
                                dropdown: "",
                                  weekdays: "flex",
                                  weekday: "text-gray-500 font-medium text-sm w-9",
                                  week: "flex w-full mt-2",
                                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                                  day_button: "h-9 w-9 rounded-md hover:bg-gray-100",
                                }}
                                formatters={{
                                  formatMonthDropdown: (date) => {
                                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                                    return meses[date.getMonth()]
                                  }
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fecha de fin</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-10"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {grafico.fechaFin ? (
                                format(grafico.fechaFin, "PPP", { locale: es })
                              ) : (
                                <span className="text-gray-500">Seleccionar fecha</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 shadow-lg border-gray-200" align="start">
                            <div className="p-4">
                              <Calendar
                                mode="single"
                                selected={grafico.fechaFin}
                                onSelect={(date) => handleFechasChange(index, grafico.fechaInicio, date)}
                                initialFocus
                                className="rounded-md"
                                captionLayout="dropdown"
                                fromYear={añosDisponibles.length > 0 ? añosDisponibles[0] : new Date().getFullYear() - 5}
                                toYear={añosDisponibles.length > 0 ? añosDisponibles[añosDisponibles.length - 1] : new Date().getFullYear()}
                                classNames={{
                                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                  month: "space-y-4",
                                  nav: "hidden",
                                  month_caption: "flex justify-center items-center text-base font-semibold mb-4 relative",
                                  caption_label: "text-gray-900",
                                  dropdowns: "flex items-center justify-center gap-3",
                                  dropdown_root: "relative border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
                                  dropdown: "appearance-none bg-transparent border-none outline-none text-sm font-medium text-gray-900 cursor-pointer pr-6",
                                  weekdays: "flex",
                                  weekday: "text-gray-500 font-medium text-sm w-9",
                                  week: "flex w-full mt-2",
                                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                                  day_button: "h-9 w-9 rounded-md hover:bg-gray-100",
                                }}
                                formatters={{
                                  formatMonthDropdown: (date) => {
                                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                                    return meses[date.getMonth()]
                                  }
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    )}
                  </div>
                )}

                {/* Gráfico */}
                {grafico.loading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
                      <p className="text-gray-600">Cargando datos...</p>
                    </div>
                  </div>
                ) : grafico.datos.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500">No hay datos disponibles para el período seleccionado</p>
                  </div>
                ) : (
                  <>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={grafico.datos}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => {
                              const percentage = percent * 100
                              // Solo mostrar porcentaje si es > 2%
                              return percentage > 2 ? `${percentage.toFixed(0)}%` : ''
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {grafico.datos.map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length > 0) {
                                const data = payload[0]
                                const value = data.value as number
                                const name = data.name || ''
                                if (grafico.tipo === 'estado') {
                                  return (
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                      <p className="font-medium text-gray-900">{name}</p>
                                      <p className="text-sm text-gray-600">{value} {value === 1 ? 'soporte' : 'soportes'}</p>
                                    </div>
                                  )
                                } else {
                                  const formatted = new Intl.NumberFormat("es-ES", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(value)
                                  return (
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                      <p className="font-medium text-gray-900">{name}</p>
                                      <p className="text-sm text-gray-600">{formatted} Bs</p>
                                    </div>
                                  )
                                }
                              }
                              return null
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Leyenda */}
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      {grafico.datos.map((item, i) => {
                        const formattedValue = new Intl.NumberFormat("es-ES", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(item.value)
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                              <span className="text-sm text-gray-700">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">{formattedValue} Bs</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

