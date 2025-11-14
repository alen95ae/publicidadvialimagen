// app/api/form/submit/service.ts
import { createMensaje, createContact, findContactByEmail } from "@/lib/airtable";
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
    // 1️⃣ Guardar mensaje en Supabase (principal)
    let mensajeId: string | null = null
    try {
      const mensajeSupabase = await createMensajeSupabase({
        nombre: p.nombre || '',
        email: p.email,
        telefono: p.telefono || undefined,
        empresa: p.empresa || undefined,
        mensaje: p.mensaje,
        estado: 'NUEVO'
      })
      mensajeId = mensajeSupabase.id || null
      console.log('  ✅ Service: Mensaje guardado en Supabase:', mensajeId)
    } catch (error: any) {
      console.error('  ❌ Service: Error guardando en Supabase:', error)
      // Continuar con Airtable como fallback
    }

    // 2️⃣ Fallback: Buscar contacto por email en Airtable (opcional, para compatibilidad)
    console.log('  🔍 Service: Buscando contacto existente con email:', p.email);
    let contactoId: string | null = null;
    
    try {
      const existing = await findContactByEmail(p.email);
      console.log('  🔍 Service: Contacto existente encontrado:', existing ? 'SÍ (ID: ' + existing.id + ')' : 'NO');

      if (existing) {
        contactoId = existing.id;
        console.log('  ✅ Service: Usando contacto existente:', contactoId);
      } else {
        console.log('  🆕 Service: Creando nuevo contacto...');
        console.log('  🆕 Service: Datos del contacto:', {
          Nombre: p.nombre || "",
          Email: p.email,
          Teléfono: p.telefono || "",
          Empresa: p.empresa || "",
        });
        
        // Crear contacto si no existe
        const nuevo = await createContact({
          Nombre: p.nombre || "",
          Email: p.email,
          ["Teléfono"]: p.telefono || "",
          Empresa: p.empresa || "",
          ["Tipo de Contacto"]: "Individual",
          ["Relación"]: "Cliente",
          Origen: ["FORMULARIO"]
        });
        contactoId = nuevo.id;
        console.log('  ✅ Service: Nuevo contacto creado exitosamente!');
        console.log('  ✅ Service: ID del contacto:', contactoId);
      }
    } catch (error: any) {
      console.error('  ⚠️ Service: Error en Airtable (no crítico):', error)
    }

    // 3️⃣ Fallback: Crear mensaje en Airtable si Supabase falló (opcional, para compatibilidad)
    if (!mensajeId) {
      try {
        console.log('  📝 Service: Creando mensaje en Airtable (fallback)...');
        const createdMsg = await createMensaje({
          Nombre: p.nombre || "",
          Email: p.email,
          ["Teléfono"]: p.telefono || "",
          Empresa: p.empresa || "",
          Mensaje: p.mensaje,
          Estado: "NUEVO"
        });
        mensajeId = createdMsg.id;
        console.log('  ✅ Service: Mensaje creado en Airtable (fallback):', mensajeId);
      } catch (error: any) {
        console.error('  ⚠️ Service: Error creando mensaje en Airtable (no crítico):', error)
      }
    }

    if (!mensajeId) {
      throw new Error('No se pudo guardar el mensaje ni en Supabase ni en Airtable')
    }

    return { contactoId, mensajeId };
  } catch (error: any) {
    console.error('  ❌❌❌ Service: Error en createContactoYMensaje:', error);
    console.error('  ❌ Service: Error message:', error.message);
    console.error('  ❌ Service: Error stack:', error.stack);
    throw error;
  }
}
