import { NextRequest, NextResponse } from 'next/server';
import { actualizarEstadoSoportesAlquileres } from '@/lib/helpersAlquileres';

/**
 * Endpoint para actualizar estados de soportes basado en alquileres
 * 
 * Este endpoint debe ser llamado diariamente (por ejemplo, desde un cron job)
 * para actualizar automáticamente los estados de los soportes:
 * 
 * - Soportes con alquileres finalizados → "Disponible" (o "A Consultar" si estaba antes)
 * - Soportes con alquileres activos → "Ocupado"
 * - Soportes "Reservado" → No se modifican (tienen lógica propia de 48h)
 * - Soportes "No disponible" → No se modifican (solo manualmente)
 * - Soportes "A Consultar" sin alquileres vigentes → No se modifican (solo manualmente)
 * 
 * Uso desde cron job (ejemplo con curl):
 * curl -X POST http://localhost:3000/api/soportes/actualizar-estados \
 *   -H "Authorization: Bearer YOUR_SECRET_TOKEN"
 * 
 * O configurar en Vercel Cron Jobs:
 * {
 *   "crons": [{
 *     "path": "/api/soportes/actualizar-estados",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Opcional: Verificar token de autorización para seguridad
    // En producción, deberías validar un token secreto
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('🔄 [API] Iniciando actualización diaria de estados de soportes...');
    const inicio = Date.now();
    
    const resultado = await actualizarEstadoSoportesAlquileres();
    
    const duracion = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      message: 'Estados de soportes actualizados correctamente',
      resultado: {
        ...resultado,
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

/**
 * También permitir GET para facilitar pruebas y configuración de cron jobs
 */
export async function GET(req: NextRequest) {
  try {
    // Opcional: Verificar token de autorización
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('🔄 [API] Iniciando actualización diaria de estados de soportes (GET)...');
    const inicio = Date.now();
    
    const resultado = await actualizarEstadoSoportesAlquileres();
    
    const duracion = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      message: 'Estados de soportes actualizados correctamente',
      resultado: {
        ...resultado,
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

