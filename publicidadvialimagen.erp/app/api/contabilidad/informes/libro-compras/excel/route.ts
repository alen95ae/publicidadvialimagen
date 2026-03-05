export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { getDataLibroCompras } from "../getData"
import type { LibroComprasFila, LibroComprasTotales } from "../getData"

function formatearNumero(n: number): string {
  const s = Number(n).toFixed(2)
  const [entera, decimal] = s.split(".")
  return `${entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${decimal}`
}

function formatFecha(fecha: string): string {
  if (!fecha) return ""
  const d = new Date(fecha + "T00:00:00")
  if (Number.isNaN(d.getTime())) return fecha
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const { searchParams } = new URL(request.url)
    const periodo_mes = searchParams.get("periodo_mes") || ""
    const periodo_anio = searchParams.get("periodo_anio") || ""
    if (!periodo_mes || !periodo_anio) {
      return NextResponse.json(
        { error: "Los parámetros periodo_mes y periodo_anio son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataLibroCompras(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      periodo_mes,
      periodo_anio,
      tipo_reporte: searchParams.get("tipo_reporte") || "Impuestos",
    })

    if (!result.data?.length) {
      return NextResponse.json(
        { error: "No hay datos para exportar con los filtros seleccionados" },
        { status: 400 }
      )
    }

    const headers = [
      "Nro",
      "Fecha",
      "NIT Proveedor",
      "Razón Social",
      "Nro Factura",
      "Nro Autorización",
      "Cód. Control",
      "Importe Total",
      "No Sujeto a CF",
      "Subtotal",
      "Descuentos",
      "Base Créd. Fiscal",
      "Crédito Fiscal",
    ]

    const sheetData: (string | number)[][] = []
    sheetData.push(["LIBRO DE COMPRAS I.V.A."])
    sheetData.push([`Período: ${periodo_anio}-${periodo_mes}`, "", "", "", "", "", "", "", "", "", "", "", ""])
    sheetData.push([])
    sheetData.push(headers)

    result.data.forEach((r: LibroComprasFila, i: number) => {
      sheetData.push([
        i + 1,
        formatFecha(r.fecha),
        r.nit,
        r.proveedor,
        r.nro_factura,
        r.nro_autorizacion,
        r.codigo_control,
        formatearNumero(r.importe_total),
        formatearNumero(r.importe_no_sujeto_cf),
        formatearNumero(r.subtotal),
        formatearNumero(r.descuentos),
        formatearNumero(r.base_credito_fiscal),
        formatearNumero(r.credito_fiscal),
      ])
    })

    const t: LibroComprasTotales = result.totales
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTALES",
      formatearNumero(t.importe_total),
      formatearNumero(t.importe_no_sujeto_cf),
      formatearNumero(t.subtotal),
      formatearNumero(t.descuentos),
      formatearNumero(t.base_credito_fiscal),
      formatearNumero(t.credito_fiscal),
    ])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Libro Compras")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `libro_compras_iva_${d}-${m}-${y}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error(
      "Error in GET /api/contabilidad/informes/libro-compras/excel:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
