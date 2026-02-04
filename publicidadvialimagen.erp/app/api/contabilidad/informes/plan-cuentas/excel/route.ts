export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"
import { requirePermiso } from "@/lib/permisos"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver")
    if (permiso instanceof Response) return permiso

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const clasificador = searchParams.get("clasificador")
    const desde_cuenta = searchParams.get("desde_cuenta")
    const hasta_cuenta = searchParams.get("hasta_cuenta")
    const aitb = searchParams.get("aitb")
    const transaccional = searchParams.get("transaccional")
    const nivel = searchParams.get("nivel")
    const tipo_cuenta = searchParams.get("tipo_cuenta")

    let query = supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, nivel, tipo_cuenta, cuenta_padre, aitb, transaccional")
      .eq("empresa_id", 1)
      .order("cuenta", { ascending: true })

    if (clasificador) query = query.eq("clasificador", clasificador)
    if (desde_cuenta) query = query.gte("cuenta", desde_cuenta)
    if (hasta_cuenta) query = query.lte("cuenta", hasta_cuenta)
    if (aitb === "true") query = query.eq("aitb", true)
    if (aitb === "false") query = query.eq("aitb", false)
    if (transaccional === "true") query = query.eq("transaccional", true)
    if (transaccional === "false") query = query.eq("transaccional", false)
    if (nivel) query = query.eq("nivel", parseInt(nivel, 10))
    if (tipo_cuenta) query = query.eq("tipo_cuenta", tipo_cuenta)

    const { data, error } = await query

    if (error) {
      if (
        error.code === "PGRST116" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("relation")
      ) {
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.aoa_to_sheet([["Plan de Cuentas"], [], ["No hay datos."]])
        XLSX.utils.book_append_sheet(wb, ws, "Plan de Cuentas")
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="plan_cuentas.xlsx"`,
          },
        })
      }
      return NextResponse.json(
        { error: "Error al obtener el plan de cuentas", details: error.message },
        { status: 500 }
      )
    }

    const rows = (data || []).map((c: any) => ({
      Cuenta: c.cuenta,
      Descripción: c.descripcion,
      Nivel: c.nivel,
      Tipo: c.tipo_cuenta || "-",
      "Cuenta padre": c.cuenta_padre ?? "",
      AITB: c.aitb ? "Sí" : "No",
      Transaccional: c.transaccional ? "Sí" : "No",
    }))

    const emptyRow = { Cuenta: "", Descripción: "Sin datos", Nivel: "", Tipo: "", "Cuenta padre": "", AITB: "", Transaccional: "" }
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [emptyRow])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plan de Cuentas")

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const hoy = new Date()
    const d = String(hoy.getDate()).padStart(2, "0")
    const m = String(hoy.getMonth() + 1).padStart(2, "0")
    const y = hoy.getFullYear()
    const nombreArchivo = `plan_cuentas_${d}-${m}-${y}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error in GET /api/contabilidad/informes/plan-cuentas/excel:", error)
    return NextResponse.json(
      { error: "Error al generar el Excel", details: error?.message },
      { status: 500 }
    )
  }
}
