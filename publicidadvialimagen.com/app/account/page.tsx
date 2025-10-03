"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Heart, TrendingUp, FileText, MessageSquare, LogOut, Loader2 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

import ProfileTab from "./components/ProfileTab"
import FavoritesTab from "./components/FavoritesTab"
import CampaignsTab from "./components/CampaignsTab"
import QuotesTab from "./components/QuotesTab"
import MessagesTab from "./components/MessagesTab"

export default function AccountPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  
  // Leer el tab desde la URL o el hash
  useEffect(() => {
    const tab = searchParams.get('tab')
    const hash = window.location.hash.replace('#', '')
    
    if (tab) {
      setActiveTab(tab)
    } else if (hash) {
      setActiveTab(hash)
    }
  }, [searchParams])

  // Escuchar cambios en el hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveTab(hash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    
    // Verificar el hash inicial
    const initialHash = window.location.hash.replace('#', '')
    if (initialHash) {
      setActiveTab(initialHash)
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
      router.push("/")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión",
      })
    } finally {
      setLoggingOut(false)
    }
  }

  // Redirigir si no está logueado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu perfil, campañas y solicitudes
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4 md:mt-0"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Cerrar Sesión
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 py-3">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2 py-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Campañas</span>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2 py-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cotizaciones</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 py-3">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Mensajes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab user={user} />
          </TabsContent>

          <TabsContent value="favorites">
            <FavoritesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignsTab userId={user.id} />
          </TabsContent>

          <TabsContent value="quotes">
            <QuotesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

