export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"

function formatearNumero(numero: number): string {
  const n = Number(numero)
  const numeroFormateado = n.toFixed(2)
  const [parteEntera, parteDecimal] = numeroFormateado.split(".")
  const parteEnteraConSeparador = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${parteEnteraConSeparador},${parteDecimal}`
}

/**
 * GET - Generar Excel Libro Mayor
 * Misma lógica que GET libro-mayor: comprobantes APROBADOS por defecto,
 * comprobantes + comprobante_detalle + plan_cuentas, saldo acumulado.
 */
export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get("empresa_id") || ""
    const clasificador = searchParams.get("clasificador") || ""
    const desde_cuenta = searchParams.get("desde_cuenta") || ""
    const hasta_cuenta = searchParams.get("hasta_cuenta") || ""
    const fecha_inicial = searchParams.get("fecha_inicial") || ""
    const fecha_final = searchParams.get("fecha_final") || ""
    const estadoParam = searchParams.get("estado") || "Aprobado"
    const moneda = searchParams.get("moneda") || "BOB"

    const monedaSufijo = moneda === "USD" ? "$" : "Bs"

    let comprobantesQuery = supabase
      .from("comprobantes")
      .select("id, numero, fecha, tipo_asiento, concepto, estado")

    if (empresa_id && empresa_id !== "todos") {
      comprobantesQuery = comprobantesQuery.eq("empresa_id", empresa_id)
    }

    const estadoFiltro =
      estadoParam && estadoParam !== "Todos" ? estadoParam.toUpperCase() : "APROBADO"
    comprobantesQuery = comprobantesQuery.eq("estado", estadoFiltro)
    if (fecha_inicial) comprobantesQuery = comprobantesQuery.gte("fecha", fecha_inicial)
    if (fecha_final) comprobantesQuery = comprobantesQuery.lte("fecha", fecha_final)

    const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

    if (comprobantesError || !comprobantes || comprobantes.length === 0) {
      return NextResponse.json(
        { error: "No hay comprobantes para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const comprobanteIds = comprobantes.map((c: any) => c.id)
    let detallesQuery = supabase
      .from("comprobante_detalle")
      .select("comprobante_id, cuenta, glosa, debe_bs, haber_bs, debe_usd, haber_usd, orden")
      .in("comprobante_id", comprobanteIds)
    if (desde_cuenta) detallesQuery = detallesQuery.gte("cuenta", desde_cuenta)
    if (hasta_cuenta) detallesQuery = detallesQuery.lte("cuenta", hasta_cuenta)

    const { data: detalles, error: detallesError } = await detallesQuery

    if (detallesError || !detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: "No hay movimientos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const cuentaCodes = [...new Set(detalles.map((d: any) => d.cuenta))]
    let cuentasMap: Record<string, string> = {}
    let cuentaTipoMap: Record<string, string> = {}

    if (cuentaCodes.length > 0) {
      const { data: cuentas } = await supabase
        .from("plan_cuentas")
        .select("cuenta, descripcion, tipo_cuenta")
        .in("cuenta", cuentaCodes)
      if (cuentas) {
        cuentas.forEach((c: any) => {
          cuentasMap[c.cuenta] = c.descripcion || ""
          cuentaTipoMap[c.cuenta] = c.tipo_cuenta || ""
        })
      }
    }

    const comprobantesMap = comprobantes.reduce((acc: Record<number, any>, comp: any) => {
      acc[comp.id] = comp
      return acc
    }, {})

    let movimientos = detalles
      .map((det: any) => {
        const comprobante = comprobantesMap[det.comprobante_id]
        if (!comprobante) return null
        const debe = moneda === "USD" ? Number(det.debe_usd || 0) : Number(det.debe_bs || 0)
        const haber = moneda === "USD" ? Number(det.haber_usd || 0) : Number(det.haber_bs || 0)
        return {
          cuenta: det.cuenta,
          descripcion_cuenta: cuentasMap[det.cuenta] || "",
          tipo_cuenta: cuentaTipoMap[det.cuenta] || "",
          fecha: comprobante.fecha || "",
          numero_comprobante: comprobante.numero || "",
          glosa_comprobante: comprobante.concepto || "",
          glosa_detalle: det.glosa || "",
          debe,
          haber,
          orden: det.orden || 0,
        }
      })
      .filter((m: any) => m !== null)
      .sort((a: any, b: any) => {
        if (a.cuenta !== b.cuenta) return a.cuenta.localeCompare(b.cuenta)
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
        return String(a.numero_comprobante).localeCompare(String(b.numero_comprobante))
      })

    if (clasificador && clasificador !== "todos") {
      movimientos = movimientos.filter(
        (m: any) => (m.tipo_cuenta || "").toLowerCase() === clasificador.toLowerCase()
      )
    }

    if (movimientos.length === 0) {
      return NextResponse.json(
        { error: "No hay movimientos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    let saldoActual = 0
    let cuentaAnterior = ""
    const movimientosConSaldo = movimientos.map((m: any) => {
      if (cuentaAnterior !== "" && cuentaAnterior !== m.cuenta) saldoActual = 0
      cuentaAnterior = m.cuenta
      saldoActual = saldoActual + m.debe - m.haber
      return { ...m, saldo: saldoActual }
    })

    const headers = [
      "Fecha",
      "Nº Comprobante",
      "Cuenta",
      "Descripción",
      "Glosa",
      `Debe (${monedaSufijo})`,
      `Haber (${monedaSufijo})`,
      `Saldo (${monedaSufijo})`,
    ]

    const dataRows = movimientosConSaldo.map((m: any) => [
      m.fecha ? new Date(m.fecha).toLocaleDateString("es-ES") : "",
      m.numero_comprobante || "",
      m.cuenta || "",
      m.descripcion_cuenta || "",
      m.glosa_comprobante || "",
      m.debe !== 0 ? formatearNumero(m.debe) : "",
      m.haber !== 0 ? formatearNumero(m.haber) : "",
      formatearNumero(m.saldo),
    ])

    const datos = [headers, ...dataRows]
    const ws = XLSX.utils.aoa_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Libro Mayor")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `libro_mayor_${d}-${m}-${y}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/libro-mayor/excel:", error)
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
