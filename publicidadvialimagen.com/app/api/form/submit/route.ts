// app/api/form/submit/route.ts
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // Asegurar runtime Node.js

// Función segura para obtener Supabase Admin sin depender de imports complejos
function getSupabaseAdminSafe() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Variables de entorno de Supabase no configuradas');
      return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey
        }
      }
    });
  } catch (error) {
    console.error('⚠️ Error creando cliente Supabase:', error);
    return null;
  }
}

/**
 * POST /api/form/submit
 * 
 * REGLAS ABSOLUTAS:
 * - SIEMPRE devolver JSON (nunca HTML)
 * - Guardar formulario es CRÍTICO
 * - Notificaciones son SIDE-EFFECT (no bloqueante)
 */
export async function POST(req: Request) {
  console.log('\n🔥 ===== FORMULARIO RECIBIDO =====');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // Parsear body
    let body: any;
    try {
      body = await req.json();
      console.log('📦 Body recibido:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      return NextResponse.json(
        { ok: false, error: "Formato de datos inválido" },
        { status: 400 }
      );
    }

    // Aceptar tanto formato español como inglés
    const nombre = (body?.nombre || body?.name || "").toString().trim();
    const email = (body?.email || "").toString().trim();
    const telefono = (body?.telefono || body?.phone || "").toString().trim();
    const empresa = (body?.empresa || body?.company || "").toString().trim();
    const mensaje = (body?.mensaje || body?.message || "").toString().trim();

    console.log('📋 Datos procesados:', { nombre, email, telefono, empresa, mensaje });

    // Validación básica
    if (!email || !mensaje) {
      console.log('❌ Validación fallida: falta email o mensaje');
      return NextResponse.json(
        { ok: false, error: "Email y Mensaje son obligatorios" },
        { status: 400 }
      );
    }

    // ============================================
    // 1️⃣ GUARDAR FORMULARIO (ÚNICA OPERACIÓN CRÍTICA)
    // ============================================
    console.log('✅ Validación OK, guardando formulario...');
    
    let formularioId: string;
    try {
      const supabase = getSupabaseAdminSafe();
      
      if (!supabase) {
        console.error('❌ No se pudo obtener cliente Supabase (falta SERVICE_ROLE_KEY)');
        return NextResponse.json(
          { ok: false, error: "Error de configuración del servidor", details: "Variables de entorno no configuradas" },
          { status: 500 }
        );
      }
      
      const { data: formularioData, error: insertError } = await supabase
        .from('formularios')
        .insert({
          nombre: nombre || 'Sin nombre',
          email: email,
          telefono: telefono || null,
          empresa: empresa || null,
          mensaje: mensaje,
          estado: 'NUEVO',
          fecha: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError || !formularioData) {
        console.error('❌ Error guardando formulario:', insertError);
        return NextResponse.json(
          { ok: false, error: "Error al guardar el formulario", details: insertError?.message },
          { status: 500 }
        );
      }

      formularioId = formularioData.id;
      console.log('✅ Formulario guardado correctamente:', formularioId);
    } catch (formError: any) {
      console.error('❌❌❌ Error crítico guardando formulario:', formError);
      console.error('Error message:', formError?.message);
      console.error('Error stack:', formError?.stack);
      return NextResponse.json(
        { ok: false, error: "Error al guardar el formulario", details: formError?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // ============================================
    // 2️⃣ NOTIFICACIONES → SIDE EFFECT (NO BLOQUEANTE)
    // ============================================
    // IMPORTANTE: Si falla CUALQUIER cosa, NO afecta al formulario
    // Crear notificaciones por ROL (una por cada rol destino)
    // NO usar user_id, NO usar crearNotificacionUsuario
    try {
      const supabase = getSupabaseAdminSafe();
      
      if (supabase) {
        // Helper local para crear notificación por rol (patrón del ERP)
        const crearNotificacionPorRol = async (rolNombre: string, data: {
          titulo: string;
          mensaje: string;
          tipo: 'info' | 'success' | 'warning' | 'error';
          entidad_tipo: string;
          entidad_id: string;
          prioridad: 'baja' | 'media' | 'alta';
        }) => {
          // Normalizar rol a minúsculas
          const rolNormalizado = rolNombre.toLowerCase();
          
          const { error } = await supabase
            .from('notificaciones')
            .insert({
              titulo: data.titulo,
              mensaje: data.mensaje,
              tipo: data.tipo,
              entidad_tipo: data.entidad_tipo,
              entidad_id: data.entidad_id,
              prioridad: data.prioridad,
              roles_destino: [rolNormalizado], // Array con un solo rol
              leida: false, // Modelo legacy: leida es la fuente de verdad
              // NO pasar user_id - puede ser NULL
            });

          if (error) {
            throw error;
          }
        };

        // Crear notificación para rol 'admin'
        try {
          await crearNotificacionPorRol('admin', {
            titulo: 'Nuevo formulario recibido',
            mensaje: `${nombre} (${email}) ha enviado un nuevo formulario`,
            tipo: 'info',
            entidad_tipo: 'formulario',
            entidad_id: formularioId,
            prioridad: 'media',
          });
        } catch (error: any) {
          // Log solo en caso de error
          console.error('[NOTIFICACIONES] Error creando notificación de formulario para admin:', error?.message || 'Unknown');
        }

        // Crear notificación para rol 'ventas'
        try {
          await crearNotificacionPorRol('ventas', {
            titulo: 'Nuevo formulario recibido',
            mensaje: `${nombre} (${email}) ha enviado un nuevo formulario`,
            tipo: 'info',
            entidad_tipo: 'formulario',
            entidad_id: formularioId,
            prioridad: 'media',
          });
        } catch (error: any) {
          // Log solo en caso de error
          console.error('[NOTIFICACIONES] Error creando notificación de formulario para ventas:', error?.message || 'Unknown');
        }
      }
      // Si no hay supabase, continuar silenciosamente sin notificaciones

    } catch (notifError: any) {
      // ERROR SILENCIOSO - NO afecta al formulario
      // Log mínimo solo si es crítico
      if (notifError?.message && !notifError.message.includes('notificaciones')) {
        console.error('[NOTIFICACIONES] Error creando notificación de formulario:', notifError?.message || 'Unknown');
      }
      // NO PROPAGAR - el formulario ya se guardó correctamente
    }

    // ============================================
    // 3️⃣ RESPUESTA JSON SIEMPRE (ÉXITO)
    // ============================================
    console.log('🔥 ===== FIN FORMULARIO (ÉXITO) =====\n');
    return NextResponse.json(
      { success: true, ok: true, id: formularioId },
      { status: 200 }
    );

  } catch (err: any) {
    // ============================================
    // CATCH FINAL - GARANTIZAR JSON SIEMPRE
    // ============================================
    console.error('❌❌❌ [FORM SUBMIT] Error crítico no controlado:', err);
    console.error('Error message:', err?.message || 'Unknown error');
    console.error('Error stack:', err?.stack || 'No stack');
    console.log('🔥 ===== FIN FORMULARIO (ERROR) =====\n');
    
    // SIEMPRE devolver JSON, NUNCA HTML
    return NextResponse.json(
      { ok: false, error: "Error procesando el formulario", details: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
