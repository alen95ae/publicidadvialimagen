"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Loader2, Calendar, Mail } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
// import { supabase } from "@/lib/supabase" // DISABLED - Migrated to Airtable
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Message {
  id: string
  created_at: string
  asunto: string
  mensaje: string
  email: string
  leido: boolean
  respondido: boolean
  respuesta?: string
  fecha_respuesta?: string
}

interface MessagesTabProps {
  userId: string
}

export default function MessagesTab({ userId }: MessagesTabProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadMessages()
  }, [userId])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setMessages(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar mensajes",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('mensajes')
        .update({ leido: true })
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, leido: true } : m
      ))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Mensajes</CardTitle>
          <CardDescription>Mensajes y respuestas recibidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = messages.filter(m => !m.leido).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Mensajes</CardTitle>
        <CardDescription>
          Mensajes y respuestas recibidas ({messages.length})
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount} sin leer
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes mensajes</h3>
            <p className="text-muted-foreground mb-4">
              Los mensajes y respuestas que recibas aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className={`overflow-hidden ${!message.leido ? 'border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{message.asunto}</h3>
                        {!message.leido && (
                          <Badge variant="default" className="text-xs">Nuevo</Badge>
                        )}
                        {message.respondido && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Respondido
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(message.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Mail className="h-4 w-4" />
                    <span>{message.email}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {message.mensaje}
                  </p>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => !message.leido && markAsRead(message.id)}
                      >
                        Ver Mensaje Completo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{message.asunto}</DialogTitle>
                        <DialogDescription>
                          Recibido el {format(new Date(message.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">De</h4>
                          <p className="text-sm">{message.email}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Mensaje</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {message.mensaje}
                          </p>
                        </div>
                        {message.respuesta && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2 text-green-600">Respuesta</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {message.respuesta}
                            </p>
                            {message.fecha_respuesta && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Respondido el {format(new Date(message.fecha_respuesta), "d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

