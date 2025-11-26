// app/api/form/submit/service.ts
import { createMensajeSupabase } from "@/lib/supabaseMensajes";

type Payload = {
  nombre?: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
};

export async function createContactoYMensaje(p: Payload) {
  console.log('  🔍 Service: Formulario recibido:', p);
  
  try {
    // Guardar mensaje en Supabase
    const mensajeSupabase = await createMensajeSupabase({
      nombre: p.nombre || '',
      email: p.email,
      telefono: p.telefono || undefined,
      empresa: p.empresa || undefined,
      mensaje: p.mensaje,
      estado: 'NUEVO'
    })
    
    const mensajeId = mensajeSupabase.id || null
    console.log('  ✅ Service: Mensaje guardado en Supabase:', mensajeId)
    
    if (!mensajeId) {
      throw new Error('No se pudo guardar el mensaje en Supabase')
    }

    return { contactoId: null, mensajeId };
  } catch (error: any) {
    console.error('  ❌❌❌ Service: Error en createContactoYMensaje:', error);
    console.error('  ❌ Service: Error message:', error.message);
    console.error('  ❌ Service: Error stack:', error.stack);
    throw error;
  }
}
