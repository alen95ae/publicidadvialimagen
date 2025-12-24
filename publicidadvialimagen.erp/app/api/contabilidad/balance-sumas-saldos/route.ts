export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"

// GET - Balance de Sumas y Saldos
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || "1"
    const gestion = searchParams.get("gestion")
    const periodo = searchParams.get("periodo")
    const estado = searchParams.get("estado") // "APROBADO", "BORRADOR", "REVERTIDO", o null para "Todos"
    const desdeCuenta = searchParams.get("desde_cuenta")
    const hastaCuenta = searchParams.get("hasta_cuenta")
    const incluirSinMovimiento = searchParams.get("incluir_sin_movimiento") !== "false" // default true
    const nivel = searchParams.get("nivel")
    const tipoCuenta = searchParams.get("tipo_cuenta")

    // Validar parámetros requeridos
    if (!gestion || !periodo) {
      return NextResponse.json(
        { error: "Los parámetros 'gestion' y 'periodo' son requeridos" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // NOTA: La consulta SQL especificada es:
    // WITH movimientos AS (
    //   SELECT cd.cuenta, SUM(cd.debe_bs) AS debe_bs, SUM(cd.haber_bs) AS haber_bs,
    //          SUM(cd.debe_usd) AS debe_usd, SUM(cd.haber_usd) AS haber_usd
    //   FROM comprobante_detalle cd
    //   INNER JOIN comprobantes c ON c.id = cd.comprobante_id
    //   WHERE c.estado = 'APROBADO' AND c.empresa_id = $1 AND c.gestion = $2 AND c.periodo = $3
    //   GROUP BY cd.cuenta
    // )
    // SELECT pc.cuenta, pc.descripcion, pc.nivel, pc.tipo_cuenta,
    //        COALESCE(m.debe_bs, 0) AS debe_bs, COALESCE(m.haber_bs, 0) AS haber_bs,
    //        COALESCE(m.debe_usd, 0) AS debe_usd, COALESCE(m.haber_usd, 0) AS haber_usd,
    //        COALESCE(m.debe_bs, 0) - COALESCE(m.haber_bs, 0) AS saldo_bs,
    //        COALESCE(m.debe_usd, 0) - COALESCE(m.haber_usd, 0) AS saldo_usd
    // FROM plan_cuentas pc
    // LEFT JOIN movimientos m ON m.cuenta = pc.cuenta
    // WHERE pc.empresa_id = $1 AND pc.vigente = true
    // ORDER BY pc.cuenta;
    //
    // Esta implementación ejecuta la lógica equivalente usando Supabase queries
    // (Supabase no permite SQL raw directo sin usar RPC/funciones SQL)
    
    // Construir query de comprobantes con filtros dinámicos
    let comprobantesQuery = supabase
      .from("comprobantes")
      .select("id")
      .eq("empresa_id", parseInt(empresaId))
      .eq("gestion", parseInt(gestion))
      .eq("periodo", parseInt(periodo))
    
    // Aplicar filtro de estado solo si no es "Todos"
    if (estado && estado.toUpperCase() !== "TODOS") {
      comprobantesQuery = comprobantesQuery.eq("estado", estado.toUpperCase())
    }
    
    const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

    if (comprobantesError) {
      console.error("Error fetching comprobantes:", comprobantesError)
      return NextResponse.json(
        { error: "Error al obtener los comprobantes", details: comprobantesError.message },
        { status: 500 }
      )
    }

    if (!comprobantes || comprobantes.length === 0) {
      // Si no hay comprobantes, devolver todas las cuentas con ceros (aplicando filtros)
      // Construir query de plan_cuentas con filtros dinámicos
      let cuentasQuerySinMov = supabase
        .from("plan_cuentas")
        .select("cuenta, descripcion, nivel, tipo_cuenta")
        .eq("empresa_id", parseInt(empresaId))
        .eq("vigente", true)
      
      // Aplicar filtros dinámicos
      if (desdeCuenta) {
        cuentasQuerySinMov = cuentasQuerySinMov.gte("cuenta", desdeCuenta)
      }
      if (hastaCuenta) {
        cuentasQuerySinMov = cuentasQuerySinMov.lte("cuenta", hastaCuenta)
      }
      if (nivel) {
        cuentasQuerySinMov = cuentasQuerySinMov.lte("nivel", parseInt(nivel))
      }
      if (tipoCuenta) {
        cuentasQuerySinMov = cuentasQuerySinMov.eq("tipo_cuenta", tipoCuenta)
      }
      
      cuentasQuerySinMov = cuentasQuerySinMov.order("cuenta", { ascending: true })
      
      const { data: cuentas, error: cuentasError } = await cuentasQuerySinMov

      if (cuentasError) {
        console.error("Error fetching plan_cuentas:", cuentasError)
        return NextResponse.json(
          { error: "Error al obtener el plan de cuentas", details: cuentasError.message },
          { status: 500 }
        )
      }

      let resultadoSinMov = (cuentas || []).map((c: any) => ({
        cuenta: c.cuenta,
        descripcion: c.descripcion,
        nivel: c.nivel,
        tipo_cuenta: c.tipo_cuenta,
        debe_bs: 0,
        haber_bs: 0,
        debe_usd: 0,
        haber_usd: 0,
        saldo_bs: 0,
        saldo_usd: 0,
      }))

      // Filtrar cuentas sin movimiento si está desactivado
      if (!incluirSinMovimiento) {
        resultadoSinMov = resultadoSinMov.filter((row) => 
          row.debe_bs !== 0 || row.haber_bs !== 0 || row.debe_usd !== 0 || row.haber_usd !== 0
        )
      }

      return NextResponse.json({
        success: true,
        data: resultadoSinMov,
      })
    }

    const comprobanteIds = comprobantes.map((c: any) => c.id)

    // Obtener detalles de comprobantes
    const { data: detalles, error: detallesError } = await supabase
      .from("comprobante_detalle")
      .select("cuenta, debe_bs, haber_bs, debe_usd, haber_usd")
      .in("comprobante_id", comprobanteIds)

    if (detallesError) {
      console.error("Error fetching detalles:", detallesError)
      return NextResponse.json(
        { error: "Error al obtener los detalles", details: detallesError.message },
        { status: 500 }
      )
    }

    // Agrupar movimientos por cuenta
    const movimientos: Record<string, {
      debe_bs: number
      haber_bs: number
      debe_usd: number
      haber_usd: number
    }> = {}

    ;(detalles || []).forEach((det: any) => {
      if (!movimientos[det.cuenta]) {
        movimientos[det.cuenta] = {
          debe_bs: 0,
          haber_bs: 0,
          debe_usd: 0,
          haber_usd: 0,
        }
      }
      movimientos[det.cuenta].debe_bs += parseFloat(det.debe_bs || 0)
      movimientos[det.cuenta].haber_bs += parseFloat(det.haber_bs || 0)
      movimientos[det.cuenta].debe_usd += parseFloat(det.debe_usd || 0)
      movimientos[det.cuenta].haber_usd += parseFloat(det.haber_usd || 0)
    })

    // Construir query de plan_cuentas con filtros dinámicos
    let cuentasQuery = supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, nivel, tipo_cuenta")
      .eq("empresa_id", parseInt(empresaId))
      .eq("vigente", true)
    
    // Aplicar filtros dinámicos
    if (desdeCuenta) {
      cuentasQuery = cuentasQuery.gte("cuenta", desdeCuenta)
    }
    if (hastaCuenta) {
      cuentasQuery = cuentasQuery.lte("cuenta", hastaCuenta)
    }
    if (nivel) {
      cuentasQuery = cuentasQuery.lte("nivel", parseInt(nivel))
    }
    if (tipoCuenta) {
      cuentasQuery = cuentasQuery.eq("tipo_cuenta", tipoCuenta)
    }
    
    cuentasQuery = cuentasQuery.order("cuenta", { ascending: true })
    
    const { data: cuentas, error: cuentasError } = await cuentasQuery

    if (cuentasError) {
      console.error("Error fetching plan_cuentas:", cuentasError)
      return NextResponse.json(
        { error: "Error al obtener el plan de cuentas", details: cuentasError.message },
        { status: 500 }
      )
    }

    // Combinar plan de cuentas con movimientos
    let resultado = (cuentas || []).map((c: any) => {
      const mov = movimientos[c.cuenta] || {
        debe_bs: 0,
        haber_bs: 0,
        debe_usd: 0,
        haber_usd: 0,
      }

      return {
        cuenta: c.cuenta,
        descripcion: c.descripcion,
        nivel: c.nivel,
        tipo_cuenta: c.tipo_cuenta,
        debe_bs: mov.debe_bs,
        haber_bs: mov.haber_bs,
        debe_usd: mov.debe_usd,
        haber_usd: mov.haber_usd,
        saldo_bs: mov.debe_bs - mov.haber_bs,
        saldo_usd: mov.debe_usd - mov.haber_usd,
      }
    })

    // Filtrar cuentas sin movimiento si está desactivado
    if (!incluirSinMovimiento) {
      resultado = resultado.filter((row) => 
        row.debe_bs !== 0 || row.haber_bs !== 0 || row.debe_usd !== 0 || row.haber_usd !== 0
      )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/balance-sumas-saldos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}

