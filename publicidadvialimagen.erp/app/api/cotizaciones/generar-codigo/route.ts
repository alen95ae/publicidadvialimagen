import { NextRequest, NextResponse } from 'next/server'
import { generarSiguienteCodigoCotizacion } from '@/lib/supabaseCotizaciones'
import { getUsuarioAutenticado } from '@/lib/cotizacionesBackend'

export async function POST(request: NextRequest) {
  // Validar autenticación
  const usuario = await getUsuarioAutenticado(request)
  if (!usuario) {
    return NextResponse.json(
      { success: false, error: 'No autorizado. Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  try {
    const codigo = await generarSiguienteCodigoCotizacion()
    
    return NextResponse.json({
      success: true,
      codigo
    })
  } catch (error) {
    console.error('❌ Error generando código de cotización:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al generar código' 
      },
      { status: 500 }
    )
  }
}






