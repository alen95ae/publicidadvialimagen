import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { crearNotificacion } from '@/lib/notificaciones';
import {
  obtenerRolesHabilitadosPorTipo,
  obtenerUsuariosPorRol,
  existeNotificacionDuplicada,
} from '@/lib/helpersNotificaciones';
import { getAlquileres } from '@/lib/supabaseAlquileres';

/**
 * Endpoint cron para procesar notificaciones temporales
 * 
 * Este endpoint debe ser llamado diariamente (por ejemplo, desde un cron job)
 * para crear notificaciones basadas en la configuración de notificacion_tipos y notificacion_roles.
 * 
 * Uso desde cron job (ejemplo con curl):
 * curl -X POST http://localhost:3000/api/cron/notificaciones \
 *   -H "Authorization: Bearer YOUR_SECRET_TOKEN"
 * 
 * O configurar en Vercel Cron Jobs:
 * {
 *   "crons": [{
 *     "path": "/api/cron/notificaciones",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Autenticación por CRON_SECRET
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🔔 [CRON NOTIFICACIONES] Iniciando procesamiento de notificaciones...');
    const inicio = Date.now();

    const supabase = getSupabaseAdmin();

    // 1. Obtener tipos de notificación activos con origen='cron'
    const { data: tiposActivos, error: tiposError } = await supabase
      .from('notificacion_tipos')
      .select('*')
      .eq('activa', true)
      .eq('origen', 'cron')
      .order('created_at', { ascending: true });

    if (tiposError) {
      console.error('❌ [CRON NOTIFICACIONES] Error obteniendo tipos activos:', tiposError);
      return NextResponse.json(
        { error: 'Error al obtener tipos de notificación' },
        { status: 500 }
      );
    }

    if (!tiposActivos || tiposActivos.length === 0) {
      console.log('⚠️ [CRON NOTIFICACIONES] No hay tipos de notificación activos con origen=cron');
      return NextResponse.json({
        success: true,
        message: 'No hay tipos de notificación activos con origen=cron',
        procesados: 0,
        duracion_ms: Date.now() - inicio,
      });
    }

    console.log(
      `📋 [CRON NOTIFICACIONES] Tipos activos con origen=cron encontrados: ${tiposActivos.length}`
    );

    let totalProcesados = 0;
    let totalCreados = 0;
    let totalDuplicados = 0;
    let totalErrores = 0;

    // 2. Procesar cada tipo activo dinámicamente
    for (const tipo of tiposActivos) {
      try {
        console.log(
          `\n🔄 [CRON NOTIFICACIONES] Procesando tipo: ${tipo.codigo} (${tipo.titulo})`
        );

        // Obtener roles habilitados para este tipo
        const rolesHabilitados = await obtenerRolesHabilitadosPorTipo(tipo.id);

        if (rolesHabilitados.length === 0) {
          console.log(
            `⏭️ [CRON NOTIFICACIONES] Tipo ${tipo.codigo}: No hay roles habilitados, saltando`
          );
          continue;
        }

        console.log(
          `👥 [CRON NOTIFICACIONES] Roles habilitados para ${tipo.codigo}: ${rolesHabilitados.join(', ')}`
        );

        // 3. Dispatcher genérico: procesar según código del tipo
        const resultado = await procesarTipoNotificacion(tipo, rolesHabilitados);
        totalProcesados += resultado.procesados;
        totalCreados += resultado.creados;
        totalDuplicados += resultado.duplicados;
        totalErrores += resultado.errores;
      } catch (error) {
        console.error(
          `❌ [CRON NOTIFICACIONES] Error procesando tipo ${tipo.codigo}:`,
          error
        );
        totalErrores++;
      }
    }

    const duracion = Date.now() - inicio;

    console.log('\n✅ [CRON NOTIFICACIONES] Procesamiento completado:');
    console.log(`   - Procesados: ${totalProcesados}`);
    console.log(`   - Creados: ${totalCreados}`);
    console.log(`   - Duplicados (omitidos): ${totalDuplicados}`);
    console.log(`   - Errores: ${totalErrores}`);
    console.log(`   - Duración: ${duracion}ms`);

    return NextResponse.json({
      success: true,
      message: 'Notificaciones procesadas correctamente',
      resultado: {
        procesados: totalProcesados,
        creados: totalCreados,
        duplicados: totalDuplicados,
        errores: totalErrores,
        duracion_ms: duracion,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [CRON NOTIFICACIONES] Error general:', error);

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
 * Dispatcher genérico para procesar tipos de notificación
 * Invoca el procesador específico según el código del tipo
 */
async function procesarTipoNotificacion(
  tipo: any,
  rolesHabilitados: string[]
): Promise<{
  procesados: number;
  creados: number;
  duplicados: number;
  errores: number;
}> {
  // Dispatcher: según código del tipo, invocar procesador específico
  switch (tipo.codigo) {
    case 'alquiler_proximo_finalizar':
      return await procesarAlquileresProximosFinalizar(tipo, rolesHabilitados);
    
    // Agregar más casos aquí para nuevos tipos de notificación
    // case 'otro_tipo':
    //   return await procesarOtroTipo(tipo, rolesHabilitados);
    
    default:
      console.log(
        `⚠️ [CRON NOTIFICACIONES] Tipo ${tipo.codigo} no tiene procesador implementado aún`
      );
      return { procesados: 0, creados: 0, duplicados: 0, errores: 0 };
  }
}

/**
 * Procesar alquileres próximos a finalizar
 */
async function procesarAlquileresProximosFinalizar(
  tipo: any,
  rolesHabilitados: string[]
): Promise<{
  procesados: number;
  creados: number;
  duplicados: number;
  errores: number;
}> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const en7Dias = new Date();
  en7Dias.setDate(en7Dias.getDate() + 7);
  en7Dias.setHours(23, 59, 59, 999);

  console.log(
    `📅 [CRON NOTIFICACIONES] Buscando alquileres entre ${hoy.toISOString().split('T')[0]} y ${en7Dias.toISOString().split('T')[0]}`
  );

  // Obtener alquileres activos (getAlquileres filtra por solapamiento, necesitamos todos los activos)
  const resultadoAlquileres = await getAlquileres({
    estado: 'activo',
    limit: 10000,
  });

  const alquileres = resultadoAlquileres?.data || [];

  if (!alquileres || alquileres.length === 0) {
    console.log('⚠️ [CRON NOTIFICACIONES] No se encontraron alquileres activos');
    return { procesados: 0, creados: 0, duplicados: 0, errores: 0 };
  }

  // Filtrar alquileres que terminan en los próximos 7 días (1-7 días)
  const alquileresFiltrados = alquileres.filter((alquiler: any) => {
    if (!alquiler.fin) return false;
    const fechaFin = new Date(alquiler.fin);
    fechaFin.setHours(0, 0, 0, 0);
    const diffMs = fechaFin.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    // Solo incluir si está entre 1 y 7 días
    return diasRestantes > 0 && diasRestantes <= 7;
  });

  console.log(
    `📊 [CRON NOTIFICACIONES] Alquileres encontrados: ${alquileresFiltrados.length}`
  );

  let procesados = 0;
  let creados = 0;
  let duplicados = 0;
  let errores = 0;

  // Procesar cada alquiler
  for (const alquiler of alquileresFiltrados) {
    try {
      procesados++;

      if (!alquiler.fin) continue;

      const fechaFin = new Date(alquiler.fin);
      fechaFin.setHours(0, 0, 0, 0);
      const diffMs = fechaFin.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Verificar duplicados
      const esDuplicado = await existeNotificacionDuplicada(
        'alquiler',
        alquiler.id,
        tipo.codigo
      );

      if (esDuplicado) {
        console.log(
          `⏭️ [CRON NOTIFICACIONES] Alquiler ${alquiler.codigo || alquiler.id}: Notificación ya existe, omitiendo`
        );
        duplicados++;
        continue;
      }

      // Crear notificación con los roles habilitados
      await crearNotificacion({
        titulo: tipo.titulo,
        mensaje: `Un alquiler finaliza en ${diasRestantes} día(s)`,
        tipo: tipo.tipo_default as 'info' | 'success' | 'warning' | 'error',
        entidad_tipo: tipo.entidad_tipo,
        entidad_id: alquiler.id,
        prioridad:
          diasRestantes <= 3
            ? 'alta'
            : diasRestantes <= 7
            ? 'media'
            : 'baja',
        roles_destino: rolesHabilitados,
      });

      creados++;
      console.log(
        `✅ [CRON NOTIFICACIONES] Notificación creada para alquiler ${alquiler.codigo || alquiler.id} (${diasRestantes} días restantes)`
      );
    } catch (error) {
      console.error(
        `❌ [CRON NOTIFICACIONES] Error procesando alquiler ${alquiler.id}:`,
        error
      );
      errores++;
    }
  }

  return { procesados, creados, duplicados, errores };
}

/**
 * También permitir GET para facilitar pruebas
 */
export async function GET(req: NextRequest) {
  return POST(req);
}

