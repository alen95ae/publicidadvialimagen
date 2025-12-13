// app/api/form/submit/service.ts
import { createMensajeSupabase } from "@/lib/supabaseMensajes";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

type Payload = {
  nombre?: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
};

/**
 * Crear notificación de formulario nuevo (helper local para proyecto .com)
 * Notifica a: Administrador, Ventas, Desarrollador
 */
async function notificarFormularioNuevoLocal(
  formularioId: string,
  nombre: string,
  email: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Obtener roles y usuarios
    const roles = ['admin', 'ventas', 'desarrollador'];
    const data = {
      titulo: 'Nuevo formulario recibido',
      mensaje: `${nombre} (${email}) ha enviado un nuevo formulario`,
      tipo: 'info',
      entidad_tipo: 'formulario', // OBLIGATORIO
      entidad_id: formularioId, // OBLIGATORIO
      prioridad: 'media',
    };

    for (const rolNombre of roles) {
      try {
        // Obtener rol (SIN .single() - puede haber 0 o más)
        const { data: rolesData } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', rolNombre);

        if (!rolesData || rolesData.length === 0) continue;
        
        const rolData = rolesData[0]; // Usar el primero si hay varios

        // Obtener usuarios del rol
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id')
          .eq('rol_id', rolData.id);

        if (!usuariosData || usuariosData.length === 0) continue;

        // Crear notificaciones
        const notificaciones = usuariosData.map((usuario) => ({
          user_id: usuario.id,
          ...data,
          leida: false,
        }));

        await supabase.from('notificaciones').insert(notificaciones);
      } catch (error) {
        // Continuar con siguiente rol si falla
        console.warn(`⚠️ Error notificando a ${rolNombre}:`, error);
      }
    }
  } catch (error) {
    console.error('⚠️ Error creando notificaciones de formulario:', error);
  }
}

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

    // Crear notificación de formulario nuevo
    // ENVOLVER EN try/catch para que NUNCA rompa la respuesta
    try {
      await notificarFormularioNuevoLocal(
        mensajeId,
        p.nombre || 'Sin nombre',
        p.email
      );
      console.log('  ✅ Service: Notificación creada para formulario:', mensajeId);
    } catch (notifError: any) {
      // NO fallar si falla la notificación - solo loguear
      console.error('  ⚠️ Service: Error creando notificación (continuando):', notifError);
      console.error('  ⚠️ Service: Error message:', notifError?.message || 'Unknown');
      console.error('  ⚠️ Service: Error stack:', notifError?.stack || 'No stack');
      // Continuar - el formulario ya se guardó correctamente
    }

    return { contactoId: null, mensajeId };
  } catch (error: any) {
    console.error('  ❌❌❌ Service: Error en createContactoYMensaje:', error);
    console.error('  ❌ Service: Error message:', error.message);
    console.error('  ❌ Service: Error stack:', error.stack);
    throw error;
  }
}
