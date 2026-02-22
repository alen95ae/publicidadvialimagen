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
    let consecutiveErrors = 0
    const MAX_CONSECUTIVE_ERRORS = 3
    const RETRY_DELAY_MS = 400
    const MAX_RETRIES = 2

    const doRedirectToLogin = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store" })
      } catch {
        // ignorar
      }
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
        router.push("/login")
      }
    }

    const fetchAuthMe = (signal?: AbortSignal) =>
      fetch("/api/auth/me", { cache: "no-store", credentials: "include", ...(signal && { signal }) })

    // Validar sesión al cargar: reintentar en 401 para evitar redirección prematura en nueva pestaña
    const validateSession = async () => {
      try {
        let attempt = 0

        while (attempt <= MAX_RETRIES) {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          const response = await fetchAuthMe(controller.signal)
          clearTimeout(timeoutId)

          if (response.ok) {
            consecutiveErrors = 0
            hasCheckedRef.current = true
            return
          }
          if (response.status === 401) {
            attempt++
            if (attempt <= MAX_RETRIES) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
              continue
            }
            await doRedirectToLogin()
            return
          }
          consecutiveErrors++
          console.warn(`[SessionProtection] Error ${response.status} validando sesión`)
          return
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.warn("[SessionProtection] Timeout validando sesión")
        } else {
          console.warn("[SessionProtection] Error validando sesión:", error)
        }
        consecutiveErrors++
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          await doRedirectToLogin()
        }
      }
    }

    validateSession()

    // Refresh periódico del token cada 10 minutos
    refreshIntervalRef.current = setInterval(async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

        const response = await fetch("/api/auth/me", {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 401) {
            // Solo redirigir si es 401
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
          // Otros errores (500, 503, etc.) - no redirigir, solo log
          else {
            console.warn(`[SessionProtection] Error ${response.status} en refresh, ignorando`)
          }
        } else {
          // Éxito - resetear contador
          consecutiveErrors = 0
        }
      } catch (error: any) {
        // Error de red o timeout - no redirigir, solo log
        if (error.name === 'AbortError') {
          console.warn("[SessionProtection] Timeout en refresh, ignorando")
        } else {
          console.warn("[SessionProtection] Error en refresh, ignorando:", error)
        }
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
