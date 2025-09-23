import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Hacer consulta simple a la tabla clientes
    const { data, error } = await supabase
      .from('clientes')
      .select('*')

    if (error) {
      return NextResponse.json({
        success: false,
        data: [],
        error: error.message,
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      error: null,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })
  }
}
