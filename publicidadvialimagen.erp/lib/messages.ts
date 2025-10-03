import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para los mensajes
export interface Message {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa: string
  mensaje: string
  fecha_recepcion: string
  estado: "NUEVO" | "EN_PROCESO" | "CONTESTADO"
  origen: "contacto" | "home"
  created_at?: string
  updated_at?: string
}

export interface Respuesta {
  id: string
  mensaje_id: string
  respuesta: string
  fecha_respuesta: string
  admin_responsable: string
  created_at?: string
}

// Funciones para manejar mensajes
export const messagesService = {
  // Obtener todos los mensajes
  async getMessages(): Promise<Message[]> {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .order('fecha_recepcion', { ascending: false })
    
    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }
    
    return data || []
  },

  // Obtener un mensaje por ID
  async getMessageById(id: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching message:', error)
      return null
    }
    
    return data
  },

  // Crear un nuevo mensaje
  async createMessage(message: Omit<Message, 'id' | 'fecha_recepcion' | 'created_at' | 'updated_at'>): Promise<Message | null> {
    const { data, error } = await supabase
      .from('mensajes')
      .insert([{
        ...message,
        fecha_recepcion: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating message:', error)
      return null
    }
    
    return data
  },

  // Actualizar estado de mensaje
  async updateMessageStatus(id: string, estado: Message['estado']): Promise<boolean> {
    const { error } = await supabase
      .from('mensajes')
      .update({ 
        estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating message status:', error)
      return false
    }
    
    return true
  },

  // Obtener respuestas de un mensaje
  async getResponses(messageId: string): Promise<Respuesta[]> {
    const { data, error } = await supabase
      .from('mensajes_respuestas')
      .select('*')
      .eq('mensaje_id', messageId)
      .order('fecha_respuesta', { ascending: true })
    
    if (error) {
      console.error('Error fetching responses:', error)
      return []
    }
    
    return data || []
  },

  // Crear una nueva respuesta
  async createResponse(response: Omit<Respuesta, 'id' | 'fecha_respuesta' | 'created_at'>): Promise<Respuesta | null> {
    const { data, error } = await supabase
      .from('mensajes_respuestas')
      .insert([{
        ...response,
        fecha_respuesta: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating response:', error)
      return null
    }
    
    return data
  }
}
