"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SoportesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a gestión de soportes
    router.replace("/panel/soportes/gestion")
  }, [router])

  return null
}