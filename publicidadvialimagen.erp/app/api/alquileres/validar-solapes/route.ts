import { NextRequest, NextResponse } from 'next/server';
import { validarSolapeAlquileres } from '@/lib/supabaseAlquileres';
import { getSoportes } from '@/lib/supabaseSoportes';

/**
 * Endpoint para validar solapes de alquileres antes de crear
 * Recibe un array de alquileres a validar y retorna los errores encontrados
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alquileres } = body;

    if (!Array.isArray(alquileres)) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de alquileres' },
        { status: 400 }
      );
    }

    const errores: Array<{
      soporte_codigo: string;
      soporte_id: string | number;
      fechaInicio: string;
      fechaFin: string;
      error: string;
    }> = [];

    // Obtener todos los soportes para mapear códigos a IDs
    const { data: todosSoportes } = await getSoportes({ limit: 10000 });
    const soportesMap = new Map<string, any>();
    todosSoportes?.forEach((s: any) => {
      soportesMap.set(s.codigo, s);
    });

    // Validar cada alquiler
    for (const alquiler of alquileres) {
      const { soporte_codigo, fechaInicio, fechaFin } = alquiler;

      if (!soporte_codigo || !fechaInicio || !fechaFin) {
        continue; // Saltar si faltan datos
      }

      // Obtener el soporte por código
      const soporte = soportesMap.get(soporte_codigo);
      if (!soporte) {
        errores.push({
          soporte_codigo,
          soporte_id: '',
          fechaInicio,
          fechaFin,
          error: `Soporte ${soporte_codigo} no encontrado`
        });
        continue;
      }

      try {
        // Validar solape
        await validarSolapeAlquileres(
          soporte.id,
          fechaInicio,
          fechaFin,
          undefined, // No excluir ningún alquiler (es creación nueva)
          soporte_codigo
        );
      } catch (error) {
        // Si hay error, es porque hay solape
        const mensajeError = error instanceof Error ? error.message : 'Error al validar solape';
        errores.push({
          soporte_codigo,
          soporte_id: soporte.id,
          fechaInicio,
          fechaFin,
          error: mensajeError
        });
      }
    }

    if (errores.length > 0) {
      return NextResponse.json({
        success: false,
        haySolapes: true,
        errores,
        mensaje: errores.map(e => `${e.soporte_codigo}: ${e.error}`).join('; ')
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      haySolapes: false,
      mensaje: 'No se encontraron solapes'
    });

  } catch (error) {
    console.error('❌ Error validando solapes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al validar solapes';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
