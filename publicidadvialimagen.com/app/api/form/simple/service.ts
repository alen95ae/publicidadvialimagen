// app/api/form/simple/service.ts
import { createMensajeSupabase } from "@/lib/supabaseMensajes"

type Payload = {
  nombre?: string
  email: string
  telefono?: string
  empresa?: string
}

export async function saveToAirtableSimple(p: Payload) {
  // Crear mensaje en Supabase
  // Nota: El nombre de la función se mantiene por compatibilidad, pero ahora usa Supabase
  try {
    const mensaje = await createMensajeSupabase({
      nombre: p.nombre || '',
      email: p.email,
      telefono: p.telefono || undefined,
      empresa: p.empresa || undefined,
      mensaje: `Formulario simple: ${p.empresa ? `Empresa: ${p.empresa}. ` : ''}${p.telefono ? `Tel: ${p.telefono}` : ''}`.trim() || 'Sin mensaje',
      estado: 'NUEVO'
    })

    const mensajeId = mensaje.id || null
    // contactoId se mantiene como null ya que no hay tabla de contactos en Supabase
    // (los datos del contacto están en el mensaje)
    return { contactoId: null, mensajeId }
  } catch (e: any) {
    console.error("[Supabase] Error guardando mensaje:", e?.message || e)
    throw e
  }
}


