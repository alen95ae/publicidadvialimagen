import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { crearNotificacionUsuario } from "@/lib/notificaciones";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = 'nodejs' // Asegurar runtime Node.js

/**
 * GET /api/debug/notificaciones-test
 * 
 * Endpoint de prueba para verificar que las notificaciones se insertan correctamente.
 * 
 * Este endpoint:
 * 1. Verifica que SUPABASE_SERVICE_ROLE_KEY existe
 * 2. Obtiene el userId autenticado
 * 3. Inserta una notificación de prueba
 * 4. Verifica que se insertó correctamente
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] [notificaciones-test] Iniciando prueba de notificaciones...');

    // 1. Verificar SERVICE_ROLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[DEBUG] [notificaciones-test] ❌ SUPABASE_SERVICE_ROLE_KEY NO EXISTE');
      return NextResponse.json({
        ok: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada',
        details: 'Verifica tu archivo .env.local'
      }, { status: 500 });
    }
    console.log('[DEBUG] [notificaciones-test] ✅ SUPABASE_SERVICE_ROLE_KEY existe');

    // 2. Verificar sesión del usuario
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({
        ok: false,
        error: 'No autorizado - no hay sesión'
      }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        return NextResponse.json({
          ok: false,
          error: 'No autorizado - sesión inválida'
        }, { status: 401 });
      }
      userId = payload.sub;
      console.log('[DEBUG] [notificaciones-test] ✅ Usuario autenticado:', userId);
    } catch (error) {
      return NextResponse.json({
        ok: false,
        error: 'No autorizado - verificación falló',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 401 });
    }

    // 3. Verificar que getSupabaseAdmin() funciona
    try {
      const supabase = getSupabaseAdmin();
      console.log('[DEBUG] [notificaciones-test] ✅ Cliente Supabase Admin obtenido');
    } catch (error) {
      console.error('[DEBUG] [notificaciones-test] ❌ Error obteniendo cliente Supabase:', error);
      return NextResponse.json({
        ok: false,
        error: 'Error obteniendo cliente Supabase',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // 4. Insertar notificación de prueba usando el helper
    try {
      console.log('[DEBUG] [notificaciones-test] Insertando notificación de prueba...');
      await crearNotificacionUsuario(userId, {
        titulo: 'Notificación de prueba',
        mensaje: 'Esta es una notificación de prueba generada por /api/debug/notificaciones-test',
        tipo: 'info',
        entidad_tipo: 'evento',
        entidad_id: 'test-' + Date.now(),
        prioridad: 'media'
      });
      console.log('[DEBUG] [notificaciones-test] ✅ Notificación insertada');
    } catch (error) {
      console.error('[DEBUG] [notificaciones-test] ❌ Error insertando notificación:', error);
      return NextResponse.json({
        ok: false,
        error: 'Error insertando notificación',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    // 5. Verificar que se insertó correctamente
    try {
      const supabase = getSupabaseAdmin();
      const { data, error: queryError } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (queryError) {
        console.error('[DEBUG] [notificaciones-test] ❌ Error consultando notificaciones:', queryError);
        return NextResponse.json({
          ok: false,
          error: 'Error consultando notificaciones',
          details: queryError.message
        }, { status: 500 });
      }

      if (!data || data.length === 0) {
        console.error('[DEBUG] [notificaciones-test] ❌ No se encontró la notificación insertada');
        return NextResponse.json({
          ok: false,
          error: 'La notificación no se encontró en la BD',
          details: 'El insert aparentemente funcionó pero la consulta no la encontró'
        }, { status: 500 });
      }

      console.log('[DEBUG] [notificaciones-test] ✅ Notificación verificada en BD:', data[0].id);

      return NextResponse.json({
        ok: true,
        message: 'Notificación de prueba insertada correctamente',
        notificacion: {
          id: data[0].id,
          titulo: data[0].titulo,
          mensaje: data[0].mensaje,
          user_id: data[0].user_id,
          created_at: data[0].created_at
        }
      });
    } catch (error) {
      console.error('[DEBUG] [notificaciones-test] ❌ Error verificando notificación:', error);
      return NextResponse.json({
        ok: false,
        error: 'Error verificando notificación',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[DEBUG] [notificaciones-test] ❌ ERROR FATAL:', error);
    return NextResponse.json({
      ok: false,
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
