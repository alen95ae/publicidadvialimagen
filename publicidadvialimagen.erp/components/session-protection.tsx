"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * Componente de protección de sesión
 * - Valida sesión al cargar
 * - Refresca token periódicamente
 * - Comportamiento silencioso (no muestra errores al usuario)
 */
export default function SessionProtection() {
  const router = useRouter()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // Validar sesión al cargar
    const validateSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: 'no-store',
          credentials: 'include'
        })

        if (!response.ok || response.status === 401) {
          // Sesión inválida - signOut silencioso
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
              cache: 'no-store'
            })
          } catch {
            // Ignorar errores de logout
          }
          
          // Limpiar storage
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
          }
          
          // Redirigir a login
          router.push("/login")
          return
        }

        hasCheckedRef.current = true
      } catch (error) {
        // Error silencioso - no mostrar al usuario
        console.warn("[SessionProtection] Error validando sesión:", error)
      }
    }

    validateSession()

    // Refresh periódico del token cada 10 minutos
    refreshIntervalRef.current = setInterval(async () => {
      try {
        // Simplemente validar la sesión - el backend manejará el refresh si es necesario
        const response = await fetch("/api/auth/me", {
          cache: 'no-store',
          credentials: 'include'
        })

        if (!response.ok || response.status === 401) {
          // Sesión expirada - signOut silencioso
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
              cache: 'no-store'
            })
          } catch {
            // Ignorar errores
          }
          
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
            router.push("/login")
          }
        }
      } catch (error) {
        // Error silencioso
        console.warn("[SessionProtection] Error en refresh:", error)
      }
    }, 1000 * 60 * 10) // 10 minutos

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [router])

  // Componente invisible
  return null
}
