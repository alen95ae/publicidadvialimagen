"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VentasPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página de cotizaciones por defecto
    router.replace("/panel/ventas/cotizaciones")
  }, [router])

  return null
}
