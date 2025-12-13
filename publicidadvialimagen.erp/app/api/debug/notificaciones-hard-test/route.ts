import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

/**
 * GET /api/debug/notificaciones-hard-test
 * 
 * Endpoint de prueba HARDCODEADO que inserta DIRECTAMENTE en la tabla notificaciones
 * sin usar helpers ni abstracciones.
 * 
 * Este endpoint DEMUESTRA si el problema está en:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - getSupabaseAdmin()
 * - La tabla notificaciones
 * - El insert directo
 */
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('══════════════════════════════════════')
  console.log('[HARD-TEST] Iniciando prueba HARDCODEADA de notificaciones...')
  console.log('══════════════════════════════════════')

  try {
    // 1. Verificar SERVICE_ROLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[HARD-TEST] Verificando SUPABASE_SERVICE_ROLE_KEY...')
    console.log('[HARD-TEST] SERVICE_ROLE_KEY existe:', !!serviceRoleKey)
    console.log('[HARD-TEST] SERVICE_ROLE_KEY length:', serviceRoleKey?.length || 0)
    
    if (!serviceRoleKey) {
      console.error('[HARD-TEST] ❌ SUPABASE_SERVICE_ROLE_KEY NO EXISTE')
      return NextResponse.json({
        ok: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada',
        details: 'Verifica tu archivo .env.local'
      }, { status: 500 });
    }
    console.log('[HARD-TEST] ✅ SUPABASE_SERVICE_ROLE_KEY existe')

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
      console.log('[HARD-TEST] ✅ Usuario autenticado:', userId)
    } catch (error) {
      return NextResponse.json({
        ok: false,
        error: 'No autorizado - verificación falló',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 401 });
    }

    // 3. Obtener cliente Supabase Admin
    console.log('[HARD-TEST] Obteniendo cliente Supabase Admin...')
    let supabase;
    try {
      supabase = getSupabaseAdmin();
      console.log('[HARD-TEST] ✅ Cliente Supabase Admin obtenido')
    } catch (error) {
      console.error('[HARD-TEST] ❌ Error obteniendo cliente Supabase:', error)
      return NextResponse.json({
        ok: false,
        error: 'Error obteniendo cliente Supabase',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    // 4. INSERT DIRECTO (HARDCODEADO) - SIN HELPERS
    const payloadHardcoded = {
      user_id: userId,
      tipo: 'info',
      titulo: 'TEST SISTEMA NOTIFICACIONES',
      mensaje: 'Inserción directa forzada',
      prioridad: 'alta',
      leida: false,
      entidad_tipo: 'debug',
      entidad_id: null
    };

    console.log('[HARD-TEST] Insertando payload HARDCODEADO:')
    console.log(JSON.stringify(payloadHardcoded, null, 2))

    let insertResult;
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('notificaciones')
        .insert(payloadHardcoded)
        .select();

      console.log('[HARD-TEST] Resultado del INSERT:')
      console.log('  - data:', insertData)
      console.log('  - error:', insertError ? {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      } : null)

      if (insertError) {
        console.error('[HARD-TEST] ❌ ERROR en INSERT:', insertError)
        return NextResponse.json({
          ok: false,
          error: 'Error en INSERT',
          insertError: {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          }
        }, { status: 500 });
      }

      insertResult = insertData;
      console.log('[HARD-TEST] ✅ INSERT exitoso')
    } catch (error) {
      console.error('[HARD-TEST] ❌ EXCEPCIÓN en INSERT:', error)
      return NextResponse.json({
        ok: false,
        error: 'Excepción en INSERT',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    // 5. SELECT inmediato para verificar
    console.log('[HARD-TEST] Haciendo SELECT para verificar inserción...')
    const { data: selectData, error: selectError } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .eq('titulo', 'TEST SISTEMA NOTIFICACIONES')
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('[HARD-TEST] Resultado del SELECT:')
    console.log('  - data:', selectData)
    console.log('  - error:', selectError ? {
      message: selectError.message,
      code: selectError.code
    } : null)

    if (selectError) {
      console.error('[HARD-TEST] ❌ ERROR en SELECT:', selectError)
      return NextResponse.json({
        ok: false,
        error: 'Error en SELECT',
        selectError: {
          message: selectError.message,
          code: selectError.code
        },
        insertResult: insertResult
      }, { status: 500 });
    }

    if (!selectData || selectData.length === 0) {
      console.error('[HARD-TEST] ❌ La notificación NO se encontró en SELECT')
      return NextResponse.json({
        ok: false,
        error: 'La notificación no se encontró en SELECT',
        details: 'El INSERT aparentemente funcionó pero el SELECT no la encontró',
        insertResult: insertResult
      }, { status: 500 });
    }

    console.log('[HARD-TEST] ✅ Notificación verificada en SELECT')
    console.log('══════════════════════════════════════')
    console.log('[HARD-TEST] ✅ PRUEBA EXITOSA')
    console.log('══════════════════════════════════════')

    return NextResponse.json({
      ok: true,
      message: 'Inserción directa HARDCODEADA exitosa',
      insertResult: insertResult,
      selectResult: selectData[0],
      userId: userId,
      confirmacion: 'La notificación se insertó y se verificó correctamente en la BD'
    });
  } catch (error) {
    console.error('══════════════════════════════════════')
    console.error('[HARD-TEST] ❌ ERROR FATAL:', error)
    console.error('══════════════════════════════════════')
    return NextResponse.json({
      ok: false,
      error: 'Error interno',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
