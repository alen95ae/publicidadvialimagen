"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Handshake, Monitor, DollarSign, FileText, AlertCircle, Calendar, Wrench, Package, Receipt } from "lucide-react"

interface MetricsData {
  mensajes: number
  alquileresActivos: number
  ventasAprobadas: number
  ingresosAlquileres: number
  facturasPendientes: number
  facturasVencidas: number
  ingresosMes: number
  trabajosPendientes: number
  instalacionesPendientes: number
  finalizanEstaSemana: number
}

export default function PanelMetrics({ userName, userRole }: { userName: string; userRole: string }) {
  const [metrics, setMetrics] = useState<MetricsData>({
    mensajes: 0,
    alquileresActivos: 0,
    ventasAprobadas: 0,
    ingresosAlquileres: 0,
    facturasPendientes: 0,
    facturasVencidas: 0,
    ingresosMes: 0,
    trabajosPendientes: 0,
    instalacionesPendientes: 0,
    finalizanEstaSemana: 0
  })
  const [loading, setLoading] = useState(true)
  const roleNormalized = userRole?.toLowerCase().trim() || ''
  const fetchingRef = useRef(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    // Prevenir múltiples ejecuciones simultáneas o si ya se inicializó
    if (fetchingRef.current || initializedRef.current) {
      return
    }

    const fetchMetrics = async () => {
      fetchingRef.current = true
      try {
        const ahora = new Date()
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59)
        
        // Calcular inicio y fin de semana (lunes a domingo)
        const inicioSemana = new Date(ahora)
        inicioSemana.setDate(ahora.getDate() - ahora.getDay() + 1) // Lunes
        inicioSemana.setHours(0, 0, 0, 0)
        const finSemana = new Date(inicioSemana)
        finSemana.setDate(inicioSemana.getDate() + 6) // Domingo
        finSemana.setHours(23, 59, 59, 999)

        if (roleNormalized === 'ventas') {
          // VENTAS: Ingresos por alquiler, Alquileres activos, Ventas del mes
          const alquileresRes = await fetch(`/api/alquileres?estado=activo&vendedor=${encodeURIComponent(userName)}&pageSize=1000`, {
            cache: 'no-store',
            credentials: 'include'
          })
          const alquileresData = alquileresRes.ok ? await alquileresRes.json() : { data: [] }
          const alquileresActivos = Array.isArray(alquileresData.data) ? alquileresData.data : []
          
          // Calcular ingresos mensuales (suma de precio mensual de alquileres activos)
          const ingresosAlquileres = alquileresActivos.reduce((sum: number, alq: any) => {
            let precioMensual = 0
            if (alq.total && alq.meses) {
              // Si tiene meses, dividir total entre meses
              precioMensual = parseFloat(alq.total) / alq.meses
            } else if (alq.total && alq.inicio && alq.fin) {
              // Si no tiene meses, calcular desde fechas
              const fechaInicio = new Date(alq.inicio)
              const fechaFin = new Date(alq.fin)
              const diferenciaMs = fechaFin.getTime() - fechaInicio.getTime()
              const dias = Math.max(1, Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24)))
              if (dias > 0) {
                const precioPorDia = parseFloat(alq.total) / dias
                precioMensual = precioPorDia * 30
              }
            }
            return sum + precioMensual
          }, 0)

          // Obtener ventas aprobadas del mes del usuario
          const ventasRes = await fetch(
            `/api/cotizaciones?estado=Aprobada&page=1&pageSize=1000`,
            {
              cache: 'no-store',
              credentials: 'include'
            }
          )
          const ventasData = ventasRes.ok ? await ventasRes.json() : { data: [] }
          
          // Filtrar por mes, vendedor y sumar totales
          const ventasDelMes = Array.isArray(ventasData.data) 
            ? ventasData.data.filter((cot: any) => {
                if (!cot.fecha_creacion) return false
                const fechaCreacion = new Date(cot.fecha_creacion)
                const fechaValida = fechaCreacion >= inicioMes && fechaCreacion <= finMes
                const vendedorValido = !userName || !cot.vendedor || cot.vendedor.toLowerCase().includes(userName.toLowerCase())
                return fechaValida && vendedorValido
              })
            : []
          
          const totalVentas = ventasDelMes.reduce((sum: number, cot: any) => {
            return sum + (parseFloat(cot.total_final) || 0)
          }, 0)

          setMetrics(prev => ({
            ...prev,
            ingresosAlquileres,
            alquileresActivos: alquileresActivos.length,
            ventasAprobadas: totalVentas
          }))
        } else if (roleNormalized === 'produccion') {
          // PRODUCCIÓN: Trabajos pendientes, Instalaciones pendientes, Finalizan esta semana
          // TODO: Implementar cuando existan endpoints para trabajos e instalaciones
          const alquileresRes = await fetch(`/api/alquileres?pageSize=1000`, {
            cache: 'no-store',
            credentials: 'include'
          })
          const alquileresData = alquileresRes.ok ? await alquileresRes.json() : { data: [] }
          const todosAlquileres = Array.isArray(alquileresData.data) ? alquileresData.data : []
          
          // Alquileres que finalizan esta semana
          const finalizanEstaSemana = todosAlquileres.filter((alq: any) => {
            if (!alq.fin) return false
            const fechaFin = new Date(alq.fin)
            return fechaFin >= inicioSemana && fechaFin <= finSemana && alq.estado === 'activo'
          }).length

          setMetrics(prev => ({
            ...prev,
            trabajosPendientes: 0, // TODO: Implementar cuando exista endpoint
            instalacionesPendientes: 0, // TODO: Implementar cuando exista endpoint
            finalizanEstaSemana
          }))
        } else if (roleNormalized === 'contabilidad') {
          // CONTABILIDAD: Facturas pendientes, Facturas vencidas, Ingresos del mes
          // TODO: Implementar cuando exista endpoint de facturas
          setMetrics(prev => ({
            ...prev,
            facturasPendientes: 0, // TODO: Implementar
            facturasVencidas: 0, // TODO: Implementar
            ingresosMes: 0 // TODO: Implementar
          }))
        } else if (roleNormalized === 'admin' || roleNormalized === 'administrador' || roleNormalized === 'desarrollador') {
          // ADMINISTRACIÓN: Ventas del mes, Alquileres activos, Facturas pendientes
          const ventasRes = await fetch(`/api/cotizaciones?estado=Aprobada&page=1&pageSize=1000`, {
            cache: 'no-store',
            credentials: 'include'
          })
          const ventasData = ventasRes.ok ? await ventasRes.json() : { data: [] }
          
          const ventasDelMes = Array.isArray(ventasData.data) 
            ? ventasData.data.filter((cot: any) => {
                if (!cot.fecha_creacion) return false
                const fechaCreacion = new Date(cot.fecha_creacion)
                return fechaCreacion >= inicioMes && fechaCreacion <= finMes
              })
            : []
          
          const totalVentas = ventasDelMes.reduce((sum: number, cot: any) => {
            return sum + (parseFloat(cot.total_final) || 0)
          }, 0)

          const alquileresRes = await fetch(`/api/alquileres?estado=activo&pageSize=1000`, {
            cache: 'no-store',
            credentials: 'include'
          })
          const alquileresData = alquileresRes.ok ? await alquileresRes.json() : { data: [] }
          const alquileresActivos = Array.isArray(alquileresData.data) ? alquileresData.data.length : 0

          setMetrics(prev => ({
            ...prev,
            ventasAprobadas: totalVentas,
            alquileresActivos,
            facturasPendientes: 0 // TODO: Implementar cuando exista endpoint
          }))
        } else {
          // Por defecto: métricas generales
          const mensajesRes = await fetch('/api/messages', {
            cache: 'no-store',
            credentials: 'include'
          })
          const mensajes = mensajesRes.ok ? await mensajesRes.json() : []
          const totalMensajes = Array.isArray(mensajes) ? mensajes.length : 0

          const alquileresRes = await fetch(`/api/alquileres?estado=activo&pageSize=1000`, {
            cache: 'no-store',
            credentials: 'include'
          })
          const alquileresData = alquileresRes.ok ? await alquileresRes.json() : { data: [] }
          const alquileresActivos = Array.isArray(alquileresData.data) ? alquileresData.data.length : 0

          setMetrics(prev => ({
            ...prev,
            mensajes: totalMensajes,
            alquileresActivos
          }))
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
        fetchingRef.current = false
        initializedRef.current = true
      }
    }

    fetchMetrics()
  }, [userName, userRole])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const renderMetrics = () => {
    if (roleNormalized === 'ventas') {
      // VENTAS: Alquileres activos (izquierda), Ingresos por alquiler (centro), Ventas (derecha)
      return (
        <>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alquileres Activos</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.alquileresActivos}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Alquileres activos"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos por Alquiler</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : formatCurrency(metrics.ingresosAlquileres)}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Ingresos mensuales"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : formatCurrency(metrics.ventasAprobadas)}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Ventas aprobadas este mes"}
              </p>
            </CardContent>
          </Card>
        </>
      )
    } else if (roleNormalized === 'produccion') {
      // PRODUCCIÓN: Trabajos pendientes, Instalaciones pendientes, Finalizan esta semana
      return (
        <>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trabajos Pendientes</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.trabajosPendientes}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Trabajos pendientes"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instalaciones Pendientes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.instalacionesPendientes}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Instalaciones pendientes"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizan Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.finalizanEstaSemana}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Alquileres que finalizan"}
              </p>
            </CardContent>
          </Card>
        </>
      )
    } else if (roleNormalized === 'contabilidad') {
      // CONTABILIDAD: Facturas pendientes, Facturas vencidas, Ingresos del mes
      return (
        <>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.facturasPendientes}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Facturas pendientes"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Vencidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? "..." : metrics.facturasVencidas}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Facturas vencidas"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : formatCurrency(metrics.ingresosMes)}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Ingresos del mes"}
              </p>
            </CardContent>
          </Card>
        </>
      )
    } else if (roleNormalized === 'admin' || roleNormalized === 'administrador' || roleNormalized === 'desarrollador') {
      // ADMINISTRACIÓN: Ventas del mes, Alquileres activos, Facturas pendientes
      return (
        <>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : formatCurrency(metrics.ventasAprobadas)}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Ventas aprobadas este mes"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alquileres Activos</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.alquileresActivos}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Alquileres activos"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.facturasPendientes}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Facturas pendientes"}
              </p>
            </CardContent>
          </Card>
        </>
      )
    } else {
      // Por defecto: métricas generales
      return (
        <>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.mensajes}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Total de mensajes"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alquileres Activos</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.alquileresActivos}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Alquileres activos"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : formatCurrency(metrics.ventasAprobadas)}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Ventas aprobadas este mes"}
              </p>
            </CardContent>
          </Card>
        </>
      )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderMetrics()}
    </div>
  )
}

