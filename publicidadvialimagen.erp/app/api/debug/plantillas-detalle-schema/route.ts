export const runtime = "nodejs";

import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"

/**
 * ENDPOINT DE DIAGNÓSTICO TEMPORAL
 * 
 * Verifica el esquema real de plantillas_contables_detalle en la base de datos
 * para confirmar si la columna 'bloqueado' existe realmente.
 * 
 * NO USAR EN PRODUCCIÓN - Solo para debugging
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Consultar el esquema real de la tabla
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'plantillas_contables_detalle'
        ORDER BY ordinal_position;
      `
    })

    if (error) {
      // Si no existe la función exec_sql, intentar consulta directa
      console.error("Error ejecutando RPC:", error)
      
      // Intentar consulta alternativa usando from
      const { data: schemaData, error: schemaError } = await supabase
        .from('plantillas_contables_detalle')
        .select('*')
        .limit(1)
        .single()

      if (schemaError) {
        return NextResponse.json({
          error: "No se pudo consultar el esquema",
          details: schemaError.message,
          suggestion: "Ejecuta esta query manualmente en Supabase SQL Editor:\n\n" +
            "SELECT column_name, data_type, is_nullable, column_default\n" +
            "FROM information_schema.columns\n" +
            "WHERE table_name = 'plantillas_contables_detalle'\n" +
            "ORDER BY ordinal_position;"
        }, { status: 500 })
      }

      // Si logramos obtener un registro, extraer las columnas
      const columns = schemaData ? Object.keys(schemaData) : []
      
      return NextResponse.json({
        success: true,
        method: "inspection",
        columns_found: columns,
        sample_data: schemaData,
        bloqueado_exists: columns.includes('bloqueado'),
        message: "Esquema extraído de datos reales (no de information_schema)"
      })
    }

    return NextResponse.json({
      success: true,
      method: "information_schema",
      schema: data,
      bloqueado_exists: data?.some((col: any) => col.column_name === 'bloqueado') ?? false,
      total_columns: data?.length ?? 0
    })
  } catch (error: any) {
    console.error("Error en endpoint de diagnóstico:", error)
    return NextResponse.json({
      error: "Error interno",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}


