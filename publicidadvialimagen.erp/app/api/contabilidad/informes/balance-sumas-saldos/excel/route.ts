export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"

// Función para formatear números
function formatearNumero(numero: number): string {
  const numeroFormateado = numero.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split('.')
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${parteEnteraConSeparador},${parteDecimal}`
}

// GET - Generar Excel del Balance de Sumas y Saldos
export async function GET(request: NextRequest) {
  try {
    // Verificar permisos
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) {
      return permiso
    }

    const supabase = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || "1"
    const gestion = searchParams.get("gestion")
    const periodo = searchParams.get("periodo")
    const estado = searchParams.get("estado")
    const desdeCuenta = searchParams.get("desde_cuenta")
    const hastaCuenta = searchParams.get("hasta_cuenta")
    const incluirSinMovimiento = searchParams.get("incluir_sin_movimiento") !== "false"
    const nivel = searchParams.get("nivel")
    const tipoCuenta = searchParams.get("tipo_cuenta")

    // Validar parámetros requeridos
    if (!gestion || !periodo) {
      return NextResponse.json(
        { error: "Los parámetros 'gestion' y 'periodo' son requeridos" },
        { status: 400 }
      )
    }

    // Obtener datos del balance (reutilizar lógica del endpoint GET)
    let comprobantesQuery = supabase
      .from("comprobantes")
      .select("id")
      .eq("empresa_id", parseInt(empresaId))
      .eq("gestion", parseInt(gestion))
      .eq("periodo", parseInt(periodo))
    
    if (estado && estado.toUpperCase() !== "TODOS") {
      comprobantesQuery = comprobantesQuery.eq("estado", estado.toUpperCase())
    }
    
    const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

    if (comprobantesError) {
      return NextResponse.json(
        { error: "Error al obtener los comprobantes", details: comprobantesError.message },
        { status: 500 }
      )
    }

    let movimientos: Record<string, {
      debe_bs: number
      haber_bs: number
      debe_usd: number
      haber_usd: number
    }> = {}

    if (comprobantes && comprobantes.length > 0) {
      const comprobanteIds = comprobantes.map((c: any) => c.id)
      const { data: detalles, error: detallesError } = await supabase
        .from("comprobante_detalle")
        .select("cuenta, debe_bs, haber_bs, debe_usd, haber_usd")
        .in("comprobante_id", comprobanteIds)

      if (detallesError) {
        return NextResponse.json(
          { error: "Error al obtener los detalles", details: detallesError.message },
          { status: 500 }
        )
      }

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
    }

    // Obtener cuentas del plan con filtros
    let cuentasQuery = supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, nivel, tipo_cuenta")
      .eq("empresa_id", parseInt(empresaId))
      .eq("vigente", true)
    
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

    // Preparar datos para Excel
    const excelData = resultado.map((row) => ({
      'Cuenta': row.cuenta,
      'Descripción': row.descripcion,
      'Debe BS': formatearNumero(row.debe_bs),
      'Haber BS': formatearNumero(row.haber_bs),
      'Saldo BS': formatearNumero(row.saldo_bs),
      'Debe USD': formatearNumero(row.debe_usd),
      'Haber USD': formatearNumero(row.haber_usd),
      'Saldo USD': formatearNumero(row.saldo_usd),
    }))

    // Calcular totales
    const totalDebeBs = resultado.reduce((sum, row) => sum + row.debe_bs, 0)
    const totalHaberBs = resultado.reduce((sum, row) => sum + row.haber_bs, 0)
    const totalSaldoBs = resultado.reduce((sum, row) => sum + row.saldo_bs, 0)
    const totalDebeUsd = resultado.reduce((sum, row) => sum + row.debe_usd, 0)
    const totalHaberUsd = resultado.reduce((sum, row) => sum + row.haber_usd, 0)
    const totalSaldoUsd = resultado.reduce((sum, row) => sum + row.saldo_usd, 0)

    // Agregar fila de totales
    excelData.push({
      'Cuenta': '',
      'Descripción': 'TOTALES',
      'Debe BS': formatearNumero(totalDebeBs),
      'Haber BS': formatearNumero(totalHaberBs),
      'Saldo BS': formatearNumero(totalSaldoBs),
      'Debe USD': formatearNumero(totalDebeUsd),
      'Haber USD': formatearNumero(totalHaberUsd),
      'Saldo USD': formatearNumero(totalSaldoUsd),
    })

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajustar anchos de columna
    const colWidths = [
      { wch: 15 }, // Cuenta
      { wch: 40 }, // Descripción
      { wch: 15 }, // Debe BS
      { wch: 15 }, // Haber BS
      { wch: 15 }, // Saldo BS
      { wch: 15 }, // Debe USD
      { wch: 15 }, // Haber USD
      { wch: 15 }, // Saldo USD
    ]
    ws['!cols'] = colWidths

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Sumas y Saldos')

    // Generar buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Generar nombre del archivo
    const hoy = new Date()
    const dia = String(hoy.getDate()).padStart(2, '0')
    const mes = String(hoy.getMonth() + 1).padStart(2, '0')
    const año = hoy.getFullYear()
    const nombreArchivo = `balance_sumas_saldos_${dia}-${mes}-${año}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/balance-sumas-saldos/excel:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}





