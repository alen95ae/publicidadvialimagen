export const runtime = "nodejs";

import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  try {
    // Verificar variables de entorno
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') ? 'Service Role' : 'Anon Key (❌ INCORRECTO)'
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        error: 'Variables de entorno faltantes',
        hasUrl,
        hasKey,
        url: hasUrl ? 'Configurado' : 'FALTA',
        key: hasKey ? 'Configurado' : 'FALTA',
        keyType: hasKey ? keyType : 'N/A'
      }, { status: 500 })
    }

    // Intentar conectar
    let supabase
    try {
      supabase = getSupabaseServer()
    } catch (initError) {
      return NextResponse.json({
        error: 'Error inicializando Supabase',
        message: initError instanceof Error ? initError.message : String(initError),
        env: {
          hasUrl,
          hasKey,
          keyType
        }
      }, { status: 500 })
    }
    
    // Probar con el nombre correcto de la tabla (minúsculas)
    const tableName = 'soportes'
    let result: any = {}
    
    try {
      console.log('🔍 Probando SELECT desde soportes...')
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (error) {
        result = {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          },
          // Diagnóstico de error común
          diagnosis: error.code === 'PGRST301' 
            ? 'RLS está habilitado pero no hay políticas. Ejecuta el script setup-supabase-rls.sql'
            : error.code === '42P01'
            ? 'La tabla no existe. Verifica el nombre de la tabla.'
            : error.code === '42703'
            ? 'Una columna no existe. Verifica los nombres de las columnas.'
            : 'Error desconocido'
        }
      } else {
        result = {
          success: true,
          count: count || 0,
          hasData: data && data.length > 0,
          columns: data && data.length > 0 ? Object.keys(data[0]) : [],
          sampleRow: data && data.length > 0 ? data[0] : null
        }
      }
    } catch (e) {
      result = {
        success: false,
        error: e instanceof Error ? {
          message: e.message,
          stack: e.stack
        } : String(e)
      }
    }
    
    return NextResponse.json({
      env: {
        hasUrl,
        hasKey,
        keyType,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      },
      test: {
        table: tableName,
        ...result
      },
      instructions: result.success 
        ? '✅ Conexión exitosa! La tabla funciona correctamente.'
        : '❌ Error detectado. Revisa el diagnóstico arriba.'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Error en test',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

