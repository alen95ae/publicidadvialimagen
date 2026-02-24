import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { verificarCronAuth } from '@/lib/cronAuth';

const ESTADOS_QUE_PUEDEN_VENCER = ['Pendiente', 'En Proceso'] as const;
const VIGENCIA_DEFAULT_DIAS = 30;

/**
 * Calcula la fecha de vencimiento: fecha_creacion + vigencia_dias.
 * Usa el mismo criterio que el resto del sistema (fecha en local según Date).
 */
function calcularFechaVencimiento(fechaCreacion: string, vigenciaDias: number): Date {
  const fecha = new Date(fechaCreacion);
  const vencimiento = new Date(fecha);
  vencimiento.setDate(vencimiento.getDate() + vigenciaDias);
  return vencimiento;
}

/**
 * Cron: actualiza a "Vencida" las cotizaciones Pendiente/En Proceso cuya
 * fecha de validez ya pasó (fecha_creacion + vigencia_dias).
 * No modifica Aprobada, Rechazada, Facturada ni Vencida.
 *
 * Vercel envía Authorization: Bearer <CRON_SECRET> cuando CRON_SECRET está definido.
 * En local (GET/POST sin header) se permite en desarrollo.
 */
async function ejecutarActualizacion(): Promise<{ revisadas: number; actualizadas: number; errores: number }> {
  const supabase = getSupabaseServer();
  const ahora = new Date();

  const { data: cotizaciones, error } = await supabase
    .from('cotizaciones')
    .select('id, codigo, estado, fecha_creacion, vigencia')
    .in('estado', [...ESTADOS_QUE_PUEDEN_VENCER]);

  if (error) {
    console.error('❌ [CRON cotizaciones] Error obteniendo cotizaciones:', error);
    throw error;
  }

  const revisadas = cotizaciones?.length ?? 0;

  if (revisadas === 0) {
    console.log('ℹ️ [CRON cotizaciones] No hay cotizaciones Pendiente/En Proceso para revisar.');
    return { revisadas: 0, actualizadas: 0, errores: 0 };
  }

  console.log(`🔄 [CRON cotizaciones] Revisando ${revisadas} cotización(es) candidata(s).`);

  let actualizadas = 0;
  let errores = 0;

  for (const cotizacion of cotizaciones ?? []) {
    if (!cotizacion.fecha_creacion) continue;

    const vigenciaDias =
      typeof cotizacion.vigencia === 'number' && !Number.isNaN(cotizacion.vigencia)
        ? cotizacion.vigencia
        : VIGENCIA_DEFAULT_DIAS;

    const fechaVencimiento = calcularFechaVencimiento(cotizacion.fecha_creacion, vigenciaDias);

    if (ahora < fechaVencimiento) continue;

    const { error: updateError } = await supabase
      .from('cotizaciones')
      .update({ estado: 'Vencida' })
      .eq('id', cotizacion.id);

    if (updateError) {
      console.error(`❌ [CRON cotizaciones] Error actualizando ${cotizacion.codigo}:`, updateError);
      errores++;
    } else {
      actualizadas++;
    }
  }

  console.log(`✅ [CRON cotizaciones] Revisadas: ${revisadas}, actualizadas: ${actualizadas}, errores: ${errores}.`);
  return { revisadas, actualizadas, errores };
}

export async function POST(req: NextRequest) {
  const inicio = Date.now();

  const authError = verificarCronAuth(req);
  if (authError) return authError;

  console.log('🔄 [CRON cotizaciones] Iniciando actualización de cotizaciones vencidas.');

  try {
    const { revisadas, actualizadas, errores } = await ejecutarActualizacion();
    const duracion_ms = Date.now() - inicio;

    return NextResponse.json({
      success: true,
      revisadas,
      actualizadas,
      errores,
      duracion_ms,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [CRON cotizaciones] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET soportado para pruebas manuales (p. ej. navegador en local)
 * y para configuración de cron (algunos sistemas llaman GET).
 */
export async function GET(req: NextRequest) {
  return POST(req);
}
