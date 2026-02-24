import { NextRequest, NextResponse } from 'next/server';
import { actualizarEstadoSoportesAlquileres } from '@/lib/helpersAlquileres';
import { verificarCronAuth } from '@/lib/cronAuth';

/**
 * Endpoint cron: actualiza estados de soportes según alquileres.
 * Vercel envía Authorization: Bearer <CRON_SECRET>. En desarrollo se permite sin header.
 */
export async function POST(req: NextRequest) {
  try {
    const authError = verificarCronAuth(req);
    if (authError) return authError;

    console.log('🔄 [CRON soportes] Iniciando actualización diaria de estados de soportes...');
    const inicio = Date.now();
    
    const resultado = await actualizarEstadoSoportesAlquileres();
    
    // Verificar y notificar alquileres próximos a finalizar
    console.log('🔔 [API] Verificando alquileres próximos a finalizar...');
    const { verificarYNotificarAlquileresProximosFinalizar } = await import('@/lib/helpersAlquileres');
    const notificaciones = await verificarYNotificarAlquileresProximosFinalizar();
    
    const duracion = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      message: 'Estados de soportes actualizados correctamente',
      resultado: {
        ...resultado,
        notificaciones_alquileres: notificaciones,
        duracion_ms: duracion
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [API] Error actualizando estados de soportes:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/** GET para pruebas y cron (misma lógica que POST). */
export async function GET(req: NextRequest) {
  try {
    const authError = verificarCronAuth(req);
    if (authError) return authError;

    console.log('🔄 [CRON soportes] Iniciando actualización diaria de estados de soportes (GET)...');
    const inicio = Date.now();
    
    const resultado = await actualizarEstadoSoportesAlquileres();
    
    // Verificar y notificar alquileres próximos a finalizar
    console.log('🔔 [API] Verificando alquileres próximos a finalizar...');
    const { verificarYNotificarAlquileresProximosFinalizar } = await import('@/lib/helpersAlquileres');
    const notificaciones = await verificarYNotificarAlquileresProximosFinalizar();
    
    const duracion = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      message: 'Estados de soportes actualizados correctamente',
      resultado: {
        ...resultado,
        notificaciones_alquileres: notificaciones,
        duracion_ms: duracion
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [API] Error actualizando estados de soportes:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

