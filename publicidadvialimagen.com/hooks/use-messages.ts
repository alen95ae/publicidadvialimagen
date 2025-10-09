"use client"

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './use-auth'
import { useToast } from './use-toast'

const MESSAGES_STORAGE_KEY = 'publicidad_vial_messages'

export interface Message {
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

export function useMessages() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar mensajes desde localStorage al inicializar
  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const storedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY)
      if (storedMessages) {
        const messagesArray = JSON.parse(storedMessages)
        // Filtrar mensajes del usuario actual si está autenticado
        if (user?.id) {
          const userMessages = messagesArray.filter((msg: Message) => 
            msg.email === user.email || msg.email === user.email
          )
          setMessages(userMessages)
        } else {
          setMessages(messagesArray)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Añadir nuevo mensaje
  const addMessage = useCallback(async (messageData: Omit<Message, 'id' | 'created_at' | 'leido' | 'respondido'>) => {
    try {
      setLoading(true)
      const newMessage: Message = {
        ...messageData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        leido: false,
        respondido: false
      }
      
      const updatedMessages = [...messages, newMessage]
      setMessages(updatedMessages)
      
      // Guardar en localStorage
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages))
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado correctamente",
      })
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [messages, toast])

  // Marcar mensaje como leído
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      setLoading(true)
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, leido: true } : msg
      )
      setMessages(updatedMessages)
      
      // Guardar en localStorage
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages))
      
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo marcar como leído",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [messages, toast])

  // Eliminar mensaje
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      setLoading(true)
      const updatedMessages = messages.filter(msg => msg.id !== messageId)
      setMessages(updatedMessages)
      
      // Guardar en localStorage
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages))
      
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje ha sido eliminado",
      })
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el mensaje",
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [messages, toast])

  return {
    messages,
    loading,
    addMessage,
    markAsRead,
    deleteMessage,
    refresh: loadMessages,
  }
}
