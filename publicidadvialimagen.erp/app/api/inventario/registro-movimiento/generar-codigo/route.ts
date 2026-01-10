/**
 * API para generar el siguiente código de movimiento (MOV-0000)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

const supabase = getSupabaseServer()

export async function GET(request: NextRequest) {
  try {
    // Buscar el último código MOV-XXXX para generar el siguiente
    const { data: ultimosMovimientos, error } = await supabase
      .from('historial_stock')
      .select('referencia_codigo')
      .like('referencia_codigo', 'MOV-%')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('❌ Error obteniendo códigos de movimiento:', error)
      // Retornar código por defecto si hay error
      return NextResponse.json({
        success: true,
        codigo: 'MOV-0001'
      })
    }
    
    // Extraer números de los códigos MOV-XXXX
    const numeros = (ultimosMovimientos || [])
      .map((record: any) => {
        const match = record.referencia_codigo?.match(/^MOV-(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((n: number) => !isNaN(n) && n > 0)
    
    const siguienteNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1
    const codigo = `MOV-${siguienteNumero.toString().padStart(4, '0')}`
    
    return NextResponse.json({
      success: true,
      codigo
    })
  } catch (error) {
    console.error('❌ Error generando código de movimiento:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar código' },
      { status: 500 }
    )
  }
}
