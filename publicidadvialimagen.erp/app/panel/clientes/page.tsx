"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ClientesPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/panel/contactos")
  }, [router])
  
  return null
}
