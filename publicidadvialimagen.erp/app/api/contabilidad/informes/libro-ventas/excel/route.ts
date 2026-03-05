export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"
import { getDataLibroVentas } from "../getData"
import type { LibroVentasFila, LibroVentasTotales } from "../getData"

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
    const periodo_mes = searchParams.get("periodo_mes") || searchParams.get("periodo") || ""
    const periodo_anio = searchParams.get("periodo_anio") || searchParams.get("año") || ""
    if (!periodo_mes || !periodo_anio) {
      return NextResponse.json(
        { error: "Los parámetros periodo_mes y periodo_anio son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const result = await getDataLibroVentas(supabase, {
      empresa_id: searchParams.get("empresa_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      periodo_mes,
      periodo_anio,
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
      "Nro Factura",
      "Nro Autorización",
      "Estado",
      "NIT Cliente",
      "Razón Social",
      "Importe Total",
      "ICE/IEHD/Tasas",
      "Export./Exentos",
      "Tasa Cero",
      "Subtotal",
      "Descuentos",
      "Base D.F.",
      "Débito Fiscal",
    ]

    const sheetData: (string | number)[][] = []
    sheetData.push(["LIBRO DE VENTAS I.V.A."])
    sheetData.push([`Período: ${periodo_anio}-${periodo_mes}`, "", "", "", "", "", "", "", "", "", "", "", "", "", ""])
    sheetData.push([])
    sheetData.push(headers)

    result.data.forEach((r: LibroVentasFila, i: number) => {
      const iceIehdTasas = r.importe_ice + r.iehd + r.ipj + r.tasas
      sheetData.push([
        i + 1,
        formatFecha(r.fecha),
        r.nro_factura,
        r.nro_autorizacion,
        r.estado_factura,
        r.nit,
        r.cliente,
        formatearNumero(r.importe_total),
        formatearNumero(iceIehdTasas),
        formatearNumero(r.exportaciones_exentos),
        formatearNumero(r.tasa_cero),
        formatearNumero(r.subtotal),
        formatearNumero(r.descuentos),
        formatearNumero(r.base_debito_fiscal),
        formatearNumero(r.debito_fiscal),
      ])
    })

    const t: LibroVentasTotales = result.totales
    const totalIceTasas = t.importe_ice + t.iehd + t.ipj + t.tasas
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTALES",
      formatearNumero(t.importe_total),
      formatearNumero(totalIceTasas),
      formatearNumero(t.exportaciones_exentos),
      formatearNumero(t.tasa_cero),
      formatearNumero(t.subtotal),
      formatearNumero(t.descuentos),
      formatearNumero(t.base_debito_fiscal),
      formatearNumero(t.debito_fiscal),
    ])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    XLSX.utils.book_append_sheet(wb, ws, "Libro Ventas")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `libro_ventas_iva_${d}-${m}-${y}.xlsx`

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
      "Error in GET /api/contabilidad/informes/libro-ventas/excel:",
      error
    )
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
