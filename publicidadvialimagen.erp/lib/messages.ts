import { getSupabaseServer } from './supabaseServer'

// Usar el cliente del servidor que bypassa RLS
const supabase = getSupabaseServer()

// Tipos para los mensajes
export interface Message {
  id: string
  nombre: string
  email: string
  telefono: string
  empresa: string
  mensaje: string
  fecha_recepcion: string
  estado: "NUEVO" | "LEÍDO" | "CONTESTADO"
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
      .order('fecha', { ascending: false })
    
    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }
    
    // Mapear los campos de Supabase al formato esperado por el frontend
    return (data || []).map((msg: any) => ({
      id: msg.id,
      nombre: msg.nombre || '',
      email: msg.email || '',
      telefono: msg.telefono || '',
      empresa: msg.empresa || '',
      mensaje: msg.mensaje || '',
      fecha_recepcion: msg.fecha || msg.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: msg.estado === 'LEIDO' ? 'LEÍDO' : (msg.estado || 'NUEVO'),
      origen: 'contacto' as const, // Valor por defecto
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }))
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
    
    if (!data) return null
    
    // Mapear los campos de Supabase al formato esperado por el frontend
    return {
      id: data.id,
      nombre: data.nombre || '',
      email: data.email || '',
      telefono: data.telefono || '',
      empresa: data.empresa || '',
      mensaje: data.mensaje || '',
      fecha_recepcion: data.fecha || data.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: data.estado === 'LEIDO' ? 'LEÍDO' : (data.estado || 'NUEVO'),
      origen: 'contacto' as const,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  },

  // Crear un nuevo mensaje
  async createMessage(message: Omit<Message, 'id' | 'fecha_recepcion' | 'created_at' | 'updated_at'>): Promise<Message | null> {
    // Mapear "LEÍDO" a "LEIDO" para la BD
    const estadoParaBD = message.estado === 'LEÍDO' ? 'LEIDO' : message.estado;
    
    const { data, error } = await supabase
      .from('mensajes')
      .insert([{
        ...message,
        estado: estadoParaBD,
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
    
    // Mapear de vuelta "LEIDO" a "LEÍDO" para el frontend
    return {
      ...data,
      estado: data.estado === 'LEIDO' ? 'LEÍDO' : data.estado
    }
  },

  // Actualizar estado de mensaje
  async updateMessageStatus(id: string, estado: Message['estado']): Promise<boolean> {
    console.log('🔄 [messagesService] Actualizando estado del mensaje');
    console.log('   ID:', id);
    console.log('   Estado recibido:', estado);
    console.log('   Tipo de estado:', typeof estado);
    console.log('   Longitud del estado:', estado?.length);
    console.log('   Estado en bytes:', Buffer.from(estado || '', 'utf8').toString('hex'));
    
    // Verificar que el ID sea válido
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('❌ [messagesService] ID inválido:', id);
      return false
    }
    
    // Verificar que el estado sea válido
    const estadosValidos = ['NUEVO', 'LEÍDO', 'CONTESTADO'];
    if (!estado || !estadosValidos.includes(estado)) {
      console.error('❌ [messagesService] Estado inválido:', estado);
      console.error('   Estados válidos:', estadosValidos);
      return false
    }
    
    // Mapeo de estados del frontend a estados de la BD
    // Supabase puede tener un constraint CHECK o ENUM que no acepta "LEÍDO" con tilde
    // Mapeamos "LEÍDO" a "LEIDO" (sin tilde) para la actualización en Supabase
    const estadoParaBD = estado === 'LEÍDO' ? 'LEIDO' : estado.trim();
    console.log('   Estado para BD (mapeado):', estadoParaBD);
    
    // Primero verificar que el mensaje existe
    const { data: existingMessage, error: fetchError } = await supabase
      .from('mensajes')
      .select('id, estado')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('❌ [messagesService] Error al verificar mensaje existente:', fetchError);
      console.error('   Error code:', fetchError.code);
      console.error('   Error message:', fetchError.message);
      return false
    }
    
    if (!existingMessage) {
      console.error('❌ [messagesService] Mensaje no encontrado con ID:', id);
      return false
    }
    
    console.log('   Estado actual en BD:', existingMessage.estado);
    
    // Solo incluir updated_at si el campo existe (puede tener trigger automático)
    // Intentar actualizar updated_at, pero si falla, intentar sin él
    try {
      console.log('   Intentando actualizar con updated_at...');
      const { data, error } = await supabase
        .from('mensajes')
        .update({ 
          estado: estadoParaBD,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (error) {
        console.log('⚠️ [messagesService] Error con updated_at, intentando sin él...');
        console.log('   Error code:', error.code);
        console.log('   Error message:', error.message);
        console.log('   Error details:', error.details);
        console.log('   Error hint:', error.hint);
        
        const { data: data2, error: error2 } = await supabase
          .from('mensajes')
          .update({ 
            estado: estadoParaBD
          })
          .eq('id', id)
          .select()
        
        if (error2) {
          console.error('❌ [messagesService] Error updating message status (sin updated_at):', error2);
          console.error('   Error code:', error2.code);
          console.error('   Error message:', error2.message);
          console.error('   Error details:', error2.details);
          console.error('   Error hint:', error2.hint);
          return false
        }
        
        console.log('✅ [messagesService] Estado actualizado correctamente (sin updated_at). Filas afectadas:', data2?.length || 0);
        if (data2 && data2.length > 0) {
          console.log('   Estado actualizado a:', data2[0].estado);
        }
        return true
      }
      
      console.log('✅ [messagesService] Estado actualizado correctamente. Filas afectadas:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('   Estado actualizado a:', data[0].estado);
      }
      return true
    } catch (e: any) {
      console.error('❌ [messagesService] Excepción al actualizar:', e);
      console.error('   Error type:', typeof e);
      console.error('   Error message:', e?.message);
      console.error('   Error stack:', e?.stack);
      return false
    }
  },

  // Actualizar mensaje completo
  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | null> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.nombre !== undefined) updateData.nombre = updates.nombre
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.telefono !== undefined) updateData.telefono = updates.telefono
    if (updates.empresa !== undefined) updateData.empresa = updates.empresa
    if (updates.mensaje !== undefined) updateData.mensaje = updates.mensaje
    // Mapear "LEÍDO" a "LEIDO" para la BD
    if (updates.estado !== undefined) {
      updateData.estado = updates.estado === 'LEÍDO' ? 'LEIDO' : updates.estado
    }
    
    const { data, error } = await supabase
      .from('mensajes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating message:', error)
      return null
    }
    
    if (!data) return null
    
    return {
      id: data.id,
      nombre: data.nombre || '',
      email: data.email || '',
      telefono: data.telefono || '',
      empresa: data.empresa || '',
      mensaje: data.mensaje || '',
      fecha_recepcion: data.fecha || data.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: data.estado === 'LEIDO' ? 'LEÍDO' : (data.estado || 'NUEVO'),
      origen: 'contacto' as const,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
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
