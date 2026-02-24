import { NextRequest, NextResponse } from 'next/server';

/**
 * Verificación de autorización para endpoints de cron.
 * - Producción: exige CRON_SECRET definido y header Authorization: Bearer <CRON_SECRET>.
 *   (Vercel envía este header cuando CRON_SECRET está configurado.)
 * - Desarrollo: permite ejecución sin header para pruebas en navegador.
 *
 * @returns NextResponse con error (401/503) si no autorizado, null si OK.
 */
export function verificarCronAuth(req: NextRequest): NextResponse | null {
  const isProduction = process.env.NODE_ENV === 'production';
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const tokenValido = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isProduction) {
    if (!cronSecret) {
      console.error('❌ [CRON] CRON_SECRET no definido en producción. Configure la variable en Vercel.');
      return NextResponse.json(
        { success: false, error: 'Cron no configurado' },
        { status: 503 }
      );
    }
    if (!tokenValido) {
      console.error('❌ [CRON] Autenticación fallida: token ausente o incorrecto.');
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    return null;
  }

  if (!cronSecret) {
    console.warn('⚠️ [CRON] CRON_SECRET no definido (desarrollo). Ejecución permitida para pruebas.');
  }
  return null;
}
