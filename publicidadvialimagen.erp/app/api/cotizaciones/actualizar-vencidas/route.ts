import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

/**
 * Endpoint para actualizar estados de cotizaciones vencidas
 * 
 * Este endpoint debe ser llamado diariamente (por ejemplo, desde un cron job)
 * para actualizar automáticamente los estados de las cotizaciones:
 * 
 * - Cotizaciones con vigencia expirada → "Vencida"
 * - Solo actualiza si el estado actual es "Pendiente" o "En Proceso"
 * - No modifica cotizaciones "Aprobada" o "Rechazada"
 * 
 * Uso desde cron job (ejemplo con curl):
 * curl -X POST http://localhost:3000/api/cotizaciones/actualizar-vencidas \
 *   -H "Authorization: Bearer YOUR_SECRET_TOKEN"
 * 
 * O configurar en Vercel Cron Jobs:
 * {
 *   "crons": [{
 *     "path": "/api/cotizaciones/actualizar-vencidas",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Opcional: Verificar token de autorización para seguridad
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    console.log('🔄 [API] Iniciando actualización de cotizaciones vencidas...');
    const inicio = Date.now();
    
    const supabase = getSupabaseServer();
    const ahora = new Date();
    
    // Obtener todas las cotizaciones que no están Aprobadas, Rechazadas o Vencidas
    // Solo queremos actualizar las que están en "Pendiente" o "En Proceso"
    const { data: cotizaciones, error } = await supabase
      .from('cotizaciones')
      .select('id, codigo, estado, fecha_creacion, vigencia')
      .in('estado', ['Pendiente', 'En Proceso']); // Solo las que pueden vencer
    
    if (error) {
      console.error('❌ [API] Error obteniendo cotizaciones:', error);
      throw error;
    }
    
    if (!cotizaciones || cotizaciones.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay cotizaciones para verificar',
        actualizadas: 0,
        duracion_ms: Date.now() - inicio,
        timestamp: new Date().toISOString()
      });
    }
    
    let actualizadas = 0;
    let errores = 0;
    
    // Verificar cada cotización
    for (const cotizacion of cotizaciones) {
      if (!cotizacion.fecha_creacion) continue;
      
      const fechaCreacion = new Date(cotizacion.fecha_creacion);
      const vigenciaDias = cotizacion.vigencia || 30;
      const fechaVencimiento = new Date(fechaCreacion);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);
      
      // Si la fecha actual es mayor que la fecha de vencimiento, actualizar
      if (ahora > fechaVencimiento) {
        try {
          const { error: updateError } = await supabase
            .from('cotizaciones')
            .update({ estado: 'Vencida' })
            .eq('id', cotizacion.id);
          
          if (updateError) {
            console.error(`❌ [API] Error actualizando cotización ${cotizacion.codigo}:`, updateError);
            errores++;
          } else {
            console.log(`✅ [API] Cotización ${cotizacion.codigo} actualizada a Vencida`);
            actualizadas++;
          }
        } catch (error) {
          console.error(`❌ [API] Error actualizando cotización ${cotizacion.id}:`, error);
          errores++;
        }
      }
    }
    
    const duracion = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      message: 'Cotizaciones vencidas actualizadas correctamente',
      resultado: {
        verificadas: cotizaciones.length,
        actualizadas,
        errores
      },
      duracion_ms: duracion,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [API] Error actualizando cotizaciones vencidas:', error);
    
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
  return POST(req);
}
