// app/api/form/submit/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { validateCriticalEndpoint } from "@/lib/api-protection";
import { formSubmitSchema, sanitizeEmailForLog } from "@/lib/validation-schemas";
import { sanitizeText } from "@/lib/sanitize";

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
  // 1. Validación de protección contra bots (ANTES de parsear body)
  const protection = validateCriticalEndpoint(req as NextRequest, false);
  if (!protection.allowed) {
    return protection.response!;
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Formulario recibido`);
  
  try {
    // Parsear y validar body con Zod
    let body: any;
    try {
      body = await req.json();
      console.log(`[${requestId}] Body parseado:`, {
        hasEmail: !!body.email,
        hasMensaje: !!body.mensaje,
        hasMessage: !!body.message,
        hasNombre: !!body.nombre,
        hasName: !!body.name,
        keys: Object.keys(body)
      });
    } catch (parseError) {
      console.error(`[${requestId}] Error parseando JSON`);
      return NextResponse.json(
        { ok: false, error: "Formato de datos inválido" },
        { status: 400 }
      );
    }

    // Validación robusta con Zod
    const validationResult = formSubmitSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      console.warn(`[${requestId}] Validación fallida:`, {
        field: firstError?.path?.join('.') || 'unknown',
        message: firstError?.message || 'Required',
        allErrors: validationResult.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
      return NextResponse.json(
        { 
          ok: false, 
          error: firstError?.message || "Datos inválidos",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { nombre, email, telefono, empresa, mensaje } = validationResult.data;

    // Sanitización XSS: eliminar HTML y atributos peligrosos de campos de texto libre
    // Aplicar DESPUÉS de validar con Zod y ANTES de guardar en BD
    const nombreSanitizado = sanitizeText(nombre);
    const empresaSanitizada = empresa ? sanitizeText(empresa) : null;
    const mensajeSanitizado = sanitizeText(mensaje);
    // NO sanitizar: email, telefono (tienen formato específico validado por Zod)

    // ============================================
    // 1️⃣ GUARDAR FORMULARIO (ÚNICA OPERACIÓN CRÍTICA)
    // ============================================
    console.log(`[${requestId}] Validación OK, guardando formulario`);
    
    let formularioId: string;
    try {
      const supabase = getSupabaseAdminSafe();
      
      if (!supabase) {
        console.error(`[${requestId}] No se pudo obtener cliente Supabase`);
        return NextResponse.json(
          { ok: false, error: "Error de configuración del servidor", details: "Variables de entorno no configuradas" },
          { status: 500 }
        );
      }
      
      const { data: formularioData, error: insertError } = await supabase
        .from('formularios')
        .insert({
          nombre: nombreSanitizado,
          email: email,
          telefono: telefono,
          empresa: empresaSanitizada,
          mensaje: mensajeSanitizado,
          estado: 'NUEVO',
          fecha: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError || !formularioData) {
        console.error(`[${requestId}] Error guardando formulario:`, insertError?.code || 'unknown');
        return NextResponse.json(
          { ok: false, error: "Error al guardar el formulario", details: insertError?.message },
          { status: 500 }
        );
      }

      formularioId = formularioData.id;
      console.log(`[${requestId}] Formulario guardado: ${formularioId}`);
    } catch (formError: any) {
      console.error(`[${requestId}] Error crítico guardando formulario:`, formError?.message || 'unknown');
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
            titulo: 'Nuevo formulario de contacto',
            mensaje: `Nuevo formulario recibido (ID: ${formularioId})`,
            tipo: 'info',
            entidad_tipo: 'formulario',
            entidad_id: formularioId,
            prioridad: 'media',
          });
        } catch (error: any) {
          console.error(`[${requestId}] Error creando notificación admin:`, error?.message || 'Unknown');
        }

        // Crear notificación para rol 'desarrollador'
        try {
          await crearNotificacionPorRol('desarrollador', {
            titulo: 'Nuevo formulario de contacto',
            mensaje: `Nuevo formulario recibido (ID: ${formularioId})`,
            tipo: 'info',
            entidad_tipo: 'formulario',
            entidad_id: formularioId,
            prioridad: 'media',
          });
        } catch (error: any) {
          console.error(`[${requestId}] Error creando notificación desarrollador:`, error?.message || 'Unknown');
        }
      }
      // Si no hay supabase, continuar silenciosamente sin notificaciones

    } catch (notifError: any) {
      // ERROR SILENCIOSO - NO afecta al formulario
      if (notifError?.message && !notifError.message.includes('notificaciones')) {
        console.error(`[${requestId}] Error en notificaciones:`, notifError?.message || 'Unknown');
      }
      // NO PROPAGAR - el formulario ya se guardó correctamente
    }

    // ============================================
    // 3️⃣ RESPUESTA JSON SIEMPRE (ÉXITO)
    // ============================================
    console.log(`[${requestId}] Formulario procesado exitosamente`);
    return NextResponse.json(
      { success: true, ok: true, id: formularioId },
      { status: 200 }
    );

  } catch (err: any) {
    // ============================================
    // CATCH FINAL - GARANTIZAR JSON SIEMPRE
    // ============================================
    console.error(`[${requestId}] Error crítico no controlado:`, err?.message || 'Unknown error');
    
    // SIEMPRE devolver JSON, NUNCA HTML
    return NextResponse.json(
      { ok: false, error: "Error procesando el formulario", details: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
