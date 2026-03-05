/**
 * Lógica del reporte Ejecución Presupuestaria.
 * Cruza presupuestos (planificado) con comprobantes + comprobante_detalle + plan_cuentas (ejecutado).
 * Solo cuentas de resultados (Ingreso, Gasto, Costo). Saldo: Ingreso = Haber - Debe; Gasto/Costo = Debe - Haber.
 */

const MES_A_COLUMNA: Record<string, string> = {
  "01": "enero",
  "1": "enero",
  "02": "febrero",
  "2": "febrero",
  "03": "marzo",
  "3": "marzo",
  "04": "abril",
  "4": "abril",
  "05": "mayo",
  "5": "mayo",
  "06": "junio",
  "6": "junio",
  "07": "julio",
  "7": "julio",
  "08": "agosto",
  "8": "agosto",
  "09": "septiembre",
  "9": "septiembre",
  "10": "octubre",
  "11": "noviembre",
  "12": "diciembre",
}

const TIPOS_RESULTADOS = ["Ingreso", "Gasto", "Costo"]

function normalizarTipo(tipo: string): string {
  if (!tipo || !tipo.trim()) return ""
  const t = tipo.trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export interface EjecucionPresupuestariaFila {
  cuenta: string
  descripcion: string
  presupuestado: number
  ejecutado: number
  diferencia: number
  porcentaje_ejecucion: number | null
}

export interface EjecucionPresupuestariaTotales {
  presupuestado: number
  ejecutado: number
  diferencia: number
}

export interface EjecucionPresupuestariaData {
  data: EjecucionPresupuestariaFila[]
  totales: EjecucionPresupuestariaTotales
}

export interface EjecucionPresupuestariaParams {
  empresa_id?: string
  sucursal_id?: string
  clasificador?: string
  mes?: string
  gestion?: string
  moneda?: string
  estado?: string
}

export async function getDataEjecucionPresupuestaria(
  supabase: any,
  params: EjecucionPresupuestariaParams
): Promise<EjecucionPresupuestariaData> {
  const {
    empresa_id = "",
    sucursal_id = "",
    clasificador = "",
    mes = "",
    gestion = "",
    moneda = "BOB",
    estado: estadoParam = "Aprobado",
  } = params

  const empty: EjecucionPresupuestariaData = {
    data: [],
    totales: { presupuestado: 0, ejecutado: 0, diferencia: 0 },
  }

  const mesNum = parseInt(mes, 10) || new Date().getMonth() + 1
  const gestionNum = parseInt(gestion, 10) || new Date().getFullYear()
  const colMes = MES_A_COLUMNA[mes] || MES_A_COLUMNA[String(mesNum).padStart(2, "0")]
  if (!colMes) {
    return empty
  }

  const fecha_inicial = `${gestionNum}-${String(mesNum).padStart(2, "0")}-01`
  const ultimoDia = lastDayOfMonth(gestionNum, mesNum)
  const fecha_final = `${gestionNum}-${String(mesNum).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`

  const estadoFiltro =
    estadoParam && estadoParam !== "Todos" ? estadoParam.toUpperCase() : undefined
  const useUsd = moneda === "USD"

  const empresaIdNumerico =
    empresa_id && empresa_id !== "todos" && !/^[0-9a-f-]{36}$/i.test(empresa_id)
      ? parseInt(empresa_id, 10)
      : null
  const presupuestoEmpresaId = Number.isNaN(empresaIdNumerico) || empresaIdNumerico == null ? 1 : empresaIdNumerico

  // —— Query 1: Presupuesto ——
  let presupuestosQuery = supabase
    .from("presupuestos")
    .select(`cuenta, ${colMes}`)
    .eq("gestion", gestionNum)
    .eq("empresa_id", presupuestoEmpresaId)

  const { data: presupuestosRows, error: errPresupuesto } = await presupuestosQuery
  if (errPresupuesto) {
    console.error("EjecucionPresupuestaria presupuestos:", errPresupuesto)
  }

  const presupuestoPorCuenta: Record<string, number> = {}
  if (presupuestosRows) {
    for (const row of presupuestosRows) {
      const cuenta = String(row.cuenta || "").trim()
      if (!cuenta) continue
      const monto = Number((row as any)[colMes] ?? 0)
      presupuestoPorCuenta[cuenta] = (presupuestoPorCuenta[cuenta] ?? 0) + monto
    }
  }

  // —— Query 2: Ejecutado (comprobantes + detalle + plan_cuentas) ——
  let comprobantesQuery = supabase
    .from("comprobantes")
    .select("id")
    .gte("fecha", fecha_inicial)
    .lte("fecha", fecha_final)

  if (estadoFiltro) {
    comprobantesQuery = comprobantesQuery.eq("estado", estadoFiltro)
  }
  if (empresa_id && empresa_id !== "todos") {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empresa_id)
    if (isUuid) {
      comprobantesQuery = comprobantesQuery.eq("empresa_uuid", empresa_id)
    } else {
      const num = parseInt(empresa_id, 10)
      if (!Number.isNaN(num)) comprobantesQuery = comprobantesQuery.eq("empresa_id", num)
    }
  }
  if (sucursal_id && sucursal_id !== "todos") {
    comprobantesQuery = comprobantesQuery.eq("sucursal_id", sucursal_id)
  }

  const { data: comprobantes, error: errComprobantes } = await comprobantesQuery
  if (errComprobantes || !comprobantes?.length) {
    const todasLasCuentas = Object.keys(presupuestoPorCuenta)
    if (todasLasCuentas.length === 0) return empty
    return buildResultado(
      supabase,
      presupuestoPorCuenta,
      {},
      todasLasCuentas,
      clasificador
    )
  }

  const comprobanteIds = comprobantes.map((c: any) => c.id)
  const { data: detalles, error: errDetalles } = await supabase
    .from("comprobante_detalle")
    .select("comprobante_id, cuenta, debe_bs, haber_bs, debe_usd, haber_usd")
    .in("comprobante_id", comprobanteIds)

  if (errDetalles || !detalles?.length) {
    const todasLasCuentas = Object.keys(presupuestoPorCuenta)
    return buildResultado(
      supabase,
      presupuestoPorCuenta,
      {},
      todasLasCuentas,
      clasificador
    )
  }

  const cuentasEnDetalle = [
    ...new Set(detalles.map((d: any) => String(d.cuenta || "").trim()).filter(Boolean)),
  ]

  let planCuentasQuery = supabase
    .from("plan_cuentas")
    .select("cuenta, descripcion, tipo_cuenta, clasificador")
    .or("tipo_cuenta.eq.Ingreso,tipo_cuenta.eq.Gasto,tipo_cuenta.eq.Costo")

  if (cuentasEnDetalle.length > 0) {
    planCuentasQuery = planCuentasQuery.in("cuenta", cuentasEnDetalle)
  }

  const { data: planCuentas, error: errPlan } = await planCuentasQuery
  if (errPlan) {
    console.error("EjecucionPresupuestaria plan_cuentas:", errPlan)
  }

  const planMap: Record<
    string,
    { descripcion: string; tipo_cuenta: string; clasificador: string }
  > = {}
  if (planCuentas) {
    for (const pc of planCuentas) {
      const tipoNorm = normalizarTipo(pc.tipo_cuenta || "")
      if (!TIPOS_RESULTADOS.includes(tipoNorm)) continue
      const clasif = (pc.clasificador || "").trim()
      if (clasificador && clasificador !== "todos" && clasif.toLowerCase() !== clasificador.toLowerCase()) {
        continue
      }
      planMap[pc.cuenta] = {
        descripcion: pc.descripcion || "",
        tipo_cuenta: tipoNorm,
        clasificador: clasif,
      }
    }
  }

  const sumasPorCuenta: Record<string, { debe: number; haber: number }> = {}
  for (const det of detalles) {
    const cuenta = String(det.cuenta || "").trim()
    if (!cuenta || !planMap[cuenta]) continue
    const debe = useUsd ? Number(det.debe_usd || 0) : Number(det.debe_bs || 0)
    const haber = useUsd ? Number(det.haber_usd || 0) : Number(det.haber_bs || 0)
    if (!sumasPorCuenta[cuenta]) {
      sumasPorCuenta[cuenta] = { debe: 0, haber: 0 }
    }
    sumasPorCuenta[cuenta].debe += debe
    sumasPorCuenta[cuenta].haber += haber
  }

  const ejecutadoPorCuenta: Record<string, number> = {}
  for (const [cuenta, sumas] of Object.entries(sumasPorCuenta)) {
    const info = planMap[cuenta]
    if (!info) continue
    const saldo =
      info.tipo_cuenta === "Ingreso"
        ? sumas.haber - sumas.debe
        : sumas.debe - sumas.haber
    ejecutadoPorCuenta[cuenta] = saldo
  }

  const todasLasCuentas = [
    ...new Set([...Object.keys(presupuestoPorCuenta), ...Object.keys(ejecutadoPorCuenta)]),
  ]

  return buildResultado(
    supabase,
    presupuestoPorCuenta,
    ejecutadoPorCuenta,
    todasLasCuentas,
    clasificador
  )
}

async function buildResultado(
  supabase: any,
  presupuestoPorCuenta: Record<string, number>,
  ejecutadoPorCuenta: Record<string, number>,
  todasLasCuentas: string[],
  clasificador: string
): Promise<EjecucionPresupuestariaData> {
  if (todasLasCuentas.length === 0) {
    return {
      data: [],
      totales: { presupuestado: 0, ejecutado: 0, diferencia: 0 },
    }
  }

  const { data: planDesc } = await supabase
    .from("plan_cuentas")
    .select("cuenta, descripcion")
    .in("cuenta", todasLasCuentas)

  const descripcionPorCuenta: Record<string, string> = {}
  if (planDesc) {
    for (const p of planDesc) {
      descripcionPorCuenta[p.cuenta] = p.descripcion || ""
    }
  }

  const resultados: EjecucionPresupuestariaFila[] = []
  let totalPresupuestado = 0
  let totalEjecutado = 0

  for (const cuenta of todasLasCuentas.sort()) {
    const presupuestado = presupuestoPorCuenta[cuenta] ?? 0
    const ejecutado = ejecutadoPorCuenta[cuenta] ?? 0
    if (presupuestado === 0 && ejecutado === 0) continue

    const diferencia = ejecutado - presupuestado
    const porcentaje_ejecucion =
      presupuestado !== 0 ? (ejecutado / presupuestado) * 100 : null

    resultados.push({
      cuenta,
      descripcion: descripcionPorCuenta[cuenta] ?? "",
      presupuestado,
      ejecutado,
      diferencia,
      porcentaje_ejecucion: porcentaje_ejecucion != null && Number.isFinite(porcentaje_ejecucion) ? porcentaje_ejecucion : null,
    })
    totalPresupuestado += presupuestado
    totalEjecutado += ejecutado
  }

  return {
    data: resultados,
    totales: {
      presupuestado: totalPresupuestado,
      ejecutado: totalEjecutado,
      diferencia: totalEjecutado - totalPresupuestado,
    },
  }
}
