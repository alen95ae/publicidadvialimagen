/**
 * Lógica compartida para Balance General (GET, Excel, PDF).
 * Saldos a una fecha, agrupados por Activo / Pasivo / Patrimonio.
 */
export interface BalanceGeneralData {
  activo: { cuenta: string; descripcion: string; saldo: number }[]
  pasivo: { cuenta: string; descripcion: string; saldo: number }[]
  patrimonio: { cuenta: string; descripcion: string; saldo: number }[]
  totales: { total_activo: number; total_pasivo: number; total_patrimonio: number }
}

export async function getDataBalanceGeneral(
  supabase: any,
  params: { a_fecha: string; empresa_id?: string; sucursal_id?: string; moneda?: string; estado?: string }
): Promise<BalanceGeneralData> {
  const { a_fecha, empresa_id = "", moneda = "BOB", estado: estadoParam = "Aprobado" } = params

  const estadoFiltro =
    estadoParam && estadoParam !== "Todos" ? estadoParam.toUpperCase() : "APROBADO"

  const empresaIdNum = Number(empresa_id)
  const empresaIdIsNumeric =
    !!empresa_id &&
    empresa_id !== "todos" &&
    !Number.isNaN(empresaIdNum) &&
    String(empresaIdNum) === String(empresa_id).trim()

  let comprobantesQuery = supabase.from("comprobantes").select("id")
  if (empresa_id && empresa_id !== "todos" && empresaIdIsNumeric) {
    comprobantesQuery = comprobantesQuery.eq("empresa_id", empresaIdNum)
  }
  comprobantesQuery = comprobantesQuery.eq("estado", estadoFiltro).lte("fecha", a_fecha)

  const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

  if (comprobantesError || !comprobantes?.length) {
    return {
      activo: [],
      pasivo: [],
      patrimonio: [],
      totales: { total_activo: 0, total_pasivo: 0, total_patrimonio: 0 },
    }
  }

  const comprobanteIds = comprobantes.map((c: any) => c.id)
  const { data: detalles, error: detallesError } = await supabase
    .from("comprobante_detalle")
    .select("comprobante_id, cuenta, debe_bs, haber_bs, debe_usd, haber_usd")
    .in("comprobante_id", comprobanteIds)

  if (detallesError || !detalles?.length) {
    return {
      activo: [],
      pasivo: [],
      patrimonio: [],
      totales: { total_activo: 0, total_pasivo: 0, total_patrimonio: 0 },
    }
  }

  const useUsd = moneda === "USD"
  const saldosPorCuenta = new Map<string, number>()
  for (const det of detalles) {
    const debe = useUsd ? Number(det.debe_usd || 0) : Number(det.debe_bs || 0)
    const haber = useUsd ? Number(det.haber_usd || 0) : Number(det.haber_bs || 0)
    const cuenta = String(det.cuenta || "").trim()
    if (!cuenta) continue
    const actual = saldosPorCuenta.get(cuenta) ?? 0
    saldosPorCuenta.set(cuenta, actual + debe - haber)
  }

  const cuentaCodes = [...saldosPorCuenta.keys()]
  let cuentasMap: Record<string, { descripcion: string; tipo_cuenta: string }> = {}
  if (cuentaCodes.length > 0) {
    const { data: planCuentas } = await supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, tipo_cuenta")
      .in("cuenta", cuentaCodes)
    if (planCuentas) {
      planCuentas.forEach((c: any) => {
        cuentasMap[c.cuenta] = {
          descripcion: c.descripcion || "",
          tipo_cuenta: (c.tipo_cuenta || "").trim(),
        }
      })
    }
  }

  const activo: { cuenta: string; descripcion: string; saldo: number }[] = []
  const pasivo: { cuenta: string; descripcion: string; saldo: number }[] = []
  const patrimonio: { cuenta: string; descripcion: string; saldo: number }[] = []

  const sortedCuentas = [...saldosPorCuenta.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  for (const [cuenta, saldo] of sortedCuentas) {
    const info = cuentasMap[cuenta] || { descripcion: "", tipo_cuenta: "" }
    const tipoNormalizado = info.tipo_cuenta
      ? info.tipo_cuenta.charAt(0).toUpperCase() + info.tipo_cuenta.slice(1).toLowerCase()
      : ""
    const fila = { cuenta, descripcion: info.descripcion, saldo }
    if (tipoNormalizado === "Activo") activo.push(fila)
    else if (tipoNormalizado === "Pasivo") pasivo.push(fila)
    else if (tipoNormalizado === "Patrimonio") patrimonio.push(fila)
  }

  const total_activo = activo.reduce((s, r) => s + r.saldo, 0)
  const total_pasivo = pasivo.reduce((s, r) => s + r.saldo, 0)
  const total_patrimonio = patrimonio.reduce((s, r) => s + r.saldo, 0)

  return {
    activo,
    pasivo,
    patrimonio,
    totales: { total_activo, total_pasivo, total_patrimonio },
  }
}
