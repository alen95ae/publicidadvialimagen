import { NextRequest, NextResponse } from 'next/server';
import { getHistorialSoporte, getUsuarioPorId } from '@/lib/supabaseHistorial';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const soporteId = parseInt(params.id);
    
    if (isNaN(soporteId)) {
      return NextResponse.json(
        { error: 'ID de soporte inválido' },
        { status: 400 }
      );
    }
    
    // Obtener historial
    const historial = await getHistorialSoporte(soporteId);
    
    // Enriquecer con información de usuarios
    const historialEnriquecido = await Promise.all(
      historial.map(async (evento) => {
        let usuarioInfo = null;
        if (evento.realizado_por) {
          usuarioInfo = await getUsuarioPorId(evento.realizado_por);
        }
        
        return {
          ...evento,
          usuario_nombre: usuarioInfo?.nombre || 'Sistema',
          usuario_email: usuarioInfo?.email || null,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: historialEnriquecido,
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

