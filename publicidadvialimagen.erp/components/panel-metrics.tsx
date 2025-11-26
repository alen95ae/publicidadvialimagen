"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Handshake, Monitor } from "lucide-react"

interface MetricsData {
  mensajes: number
  alquileresActivos: number
  ventasAprobadas: number
}

export default function PanelMetrics({ userName }: { userName: string }) {
  const [metrics, setMetrics] = useState<MetricsData>({
    mensajes: 0,
    alquileresActivos: 0,
    ventasAprobadas: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Obtener mensajes
        const mensajesRes = await fetch('/api/messages')
        const mensajes = mensajesRes.ok ? await mensajesRes.json() : []
        const totalMensajes = Array.isArray(mensajes) ? mensajes.length : 0

        // Obtener alquileres activos del vendedor
        const alquileresRes = await fetch(`/api/alquileres?estado=activo&vendedor=${encodeURIComponent(userName)}`)
        const alquileresData = alquileresRes.ok ? await alquileresRes.json() : { data: [] }
        const alquileresActivos = Array.isArray(alquileresData.data) ? alquileresData.data.length : 0

        // Obtener ventas aprobadas del mes del usuario
        const ahora = new Date()
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59)
        
        const ventasRes = await fetch(
          `/api/cotizaciones?estado=Aprobada&page=1&pageSize=1000`
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

        setMetrics({
          mensajes: totalMensajes,
          alquileresActivos,
          ventasAprobadas: totalVentas
        })
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [userName])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  )
}

