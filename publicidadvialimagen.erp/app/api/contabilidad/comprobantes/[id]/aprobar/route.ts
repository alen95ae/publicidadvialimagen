export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// POST - Aprobar un comprobante
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "editar")
    if (permiso instanceof Response) {
      return permiso
    }

    // Usar admin directamente para evitar problemas con RLS
    const supabase = getSupabaseAdmin()

    // Obtener comprobante con detalles
    const { data: comprobante, error: fetchError } = await supabase
      .from("comprobantes")
      .select(`
        *,
        detalles:comprobante_detalle(*)
      `)
      .eq("id", id)
      .eq("empresa_id", 1)
      .single()

    if (fetchError || !comprobante) {
      return NextResponse.json(
        { error: "Comprobante no encontrado" },
        { status: 404 }
      )
    }

    if (comprobante.estado === "APROBADO") {
      return NextResponse.json(
        { error: "El comprobante ya está aprobado" },
        { status: 400 }
      )
    }

    // Validar que el comprobante esté balanceado
    const detalles = comprobante.detalles || []
    const totales = detalles.reduce(
      (acc: any, det: any) => ({
        debe_bs: acc.debe_bs + (det.debe_bs || 0),
        haber_bs: acc.haber_bs + (det.haber_bs || 0),
        debe_usd: acc.debe_usd + (det.debe_usd || 0),
        haber_usd: acc.haber_usd + (det.haber_usd || 0),
      }),
      { debe_bs: 0, haber_bs: 0, debe_usd: 0, haber_usd: 0 }
    )

    const diferenciaBs = Math.abs(totales.debe_bs - totales.haber_bs)
    const diferenciaUsd = Math.abs(totales.debe_usd - totales.haber_usd)
    // Tolerancia 0.02 por redondeos (ej. crédito fiscal 13/87)
    if (diferenciaBs > 0.02 || diferenciaUsd > 0.02) {
      return NextResponse.json(
        {
          error: "El comprobante no está balanceado. Debe = Haber para poder aprobarlo.",
          detalles: {
            diferencia_bs: diferenciaBs,
            diferencia_usd: diferenciaUsd,
          },
        },
        { status: 400 }
      )
    }

    // Generar número correlativo por tipo_comprobante
    // Solo contar comprobantes APROBADOS del mismo tipo
    const { data: ultimoComprobante, error: errorUltimo } = await supabase
      .from("comprobantes")
      .select("numero")
      .eq("empresa_id", comprobante.empresa_id)
      .eq("tipo_comprobante", comprobante.tipo_comprobante)
      .eq("estado", "APROBADO")
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (errorUltimo) {
      console.error("Error obteniendo último comprobante aprobado:", errorUltimo)
      return NextResponse.json(
        { error: "Error al generar el número de comprobante", details: errorUltimo.message },
        { status: 500 }
      )
    }

    // Calcular siguiente número correlativo
    let siguienteNumero = "001"
    if (ultimoComprobante?.numero) {
      const ultimoNum = parseInt(ultimoComprobante.numero) || 0
      siguienteNumero = String(ultimoNum + 1).padStart(3, "0")
    }

    // Actualizar estado a APROBADO y asignar número en una única operación
    const { data: comprobanteAprobado, error: errorAprobar } = await supabase
      .from("comprobantes")
      .update({ 
        estado: "APROBADO",
        numero: siguienteNumero
      })
      .eq("id", id)
      .eq("empresa_id", 1)
      .select(`
        *,
        detalles:comprobante_detalle(*)
      `)
      .single()

    if (errorAprobar) {
      console.error("Error aprobando comprobante:", errorAprobar)
      return NextResponse.json(
        { error: "Error al aprobar el comprobante", details: errorAprobar.message },
        { status: 500 }
      )
    }

    // Si existe registro en Libro de Compras para este comprobante, marcarlo APROBADO
    await supabase
      .from("libro_compras")
      .update({ estado: "APROBADO", updated_at: new Date().toISOString() })
      .eq("comprobante_id", id)
      .eq("empresa_id", 1)

    return NextResponse.json({
      success: true,
      data: comprobanteAprobado,
      message: "Comprobante aprobado correctamente",
    })
  } catch (error: any) {
    console.error("Error in POST /api/contabilidad/comprobantes/[id]/aprobar:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error?.message },
      { status: 500 }
    )
  }
}

