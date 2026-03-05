/**
 * Lógica compartida para Estado de Resultados (GET, futuros Excel/PDF).
 * Solo cuentas de resultados (Ingreso, Costo, Gasto). Matemática:
 * - Ingreso (acreedora): Saldo = Sum(Haber) - Sum(Debe)
 * - Gasto/Costo (deudora): Saldo = Sum(Debe) - Sum(Haber)
 * Totales: calculados SOLO con saldos transaccionales (hojas), no con roll-up.
 * Clasificación: por primer dígito del código (4=ingresos, 5=costos, 6=gastos).
 * Nivel: roll-up para vista; cuentas raíz virtuales (4, 5, 6) si no existen en plan_cuentas.
 */
export interface EstadoResultadosFila {
  cuenta: string
  descripcion: string
  saldo: number
}

export interface EstadoResultadosTotales {
  total_ingresos: number
  total_costos: number
  total_gastos: number
  utilidad_neta: number
}

export interface EstadoResultadosData {
  ingresos: EstadoResultadosFila[]
  costos: EstadoResultadosFila[]
  gastos: EstadoResultadosFila[]
  totales: EstadoResultadosTotales
}

const TIPOS_RESULTADOS = ["Ingreso", "Gasto", "Costo"]
const RAICES_VIRTUALES: Record<string, string> = { "4": "INGRESOS", "5": "COSTOS", "6": "GASTOS" }

function normalizarTipo(tipo: string): string {
  if (!tipo || !tipo.trim()) return ""
  const t = tipo.trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

/**
 * Clasificación por primer dígito (blindaje): 4 -> ingresos, 5 -> costos, 6 -> gastos.
 */
function clasificarPorCodigo(cuenta: string): "ingresos" | "costos" | "gastos" | null {
  const primer = (cuenta || "").trim().charAt(0)
  if (primer === "4") return "ingresos"
  if (primer === "5") return "costos"
  if (primer === "6") return "gastos"
  return null
}

/**
 * Obtiene el código de la cuenta padre por jerarquía de código.
 * Incluye raíz de 1 dígito (4, 5, 6) si no existe en el set.
 */
function obtenerPadrePorCodigo(cuenta: string, cuentasConocidas: Set<string>): string | null {
  if (!cuenta || cuenta.length <= 1) return null
  for (let len = cuenta.length - 1; len >= 1; len--) {
    const padre = cuenta.slice(0, len)
    if (cuentasConocidas.has(padre)) return padre
  }
  const raiz = cuenta.charAt(0)
  if (raiz === "4" || raiz === "5" || raiz === "6") return raiz
  return null
}

export async function getDataEstadoResultados(
  supabase: any,
  params: {
    desde_fecha: string
    a_fecha: string
    empresa_id?: string
    sucursal_id?: string
    moneda?: string
    estado?: string
    nivel?: string
  }
): Promise<EstadoResultadosData> {
  const {
    desde_fecha,
    a_fecha,
    empresa_id = "",
    sucursal_id = "",
    moneda = "BOB",
    estado: estadoParam = "Aprobado",
    nivel: nivelParam = "5",
  } = params

  const estadoFiltro =
    estadoParam && estadoParam !== "Todos" ? estadoParam.toUpperCase() : undefined
  const nivelMax = Math.min(5, Math.max(1, parseInt(nivelParam, 10) || 5))
  const useUsd = moneda === "USD"

  const vacio: EstadoResultadosData = {
    ingresos: [],
    costos: [],
    gastos: [],
    totales: {
      total_ingresos: 0,
      total_costos: 0,
      total_gastos: 0,
      utilidad_neta: 0,
    },
  }

  let comprobantesQuery = supabase
    .from("comprobantes")
    .select("id")
    .gte("fecha", desde_fecha)
    .lte("fecha", a_fecha)

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

  const { data: comprobantes, error: comprobantesError } = await comprobantesQuery

  if (comprobantesError || !comprobantes?.length) {
    return vacio
  }

  const comprobanteIds = comprobantes.map((c: any) => c.id)
  const { data: detalles, error: detallesError } = await supabase
    .from("comprobante_detalle")
    .select("comprobante_id, cuenta, debe_bs, haber_bs, debe_usd, haber_usd")
    .in("comprobante_id", comprobanteIds)

  if (detallesError || !detalles?.length) {
    return vacio
  }

  const cuentaCodesMovimientos = [
    ...new Set(detalles.map((d: any) => String(d.cuenta || "").trim()).filter(Boolean)),
  ]
  if (cuentaCodesMovimientos.length === 0) return vacio

  const { data: planCuentas, error: planError } = await supabase
    .from("plan_cuentas")
    .select("cuenta, descripcion, tipo_cuenta, nivel, cuenta_padre")
    .or("tipo_cuenta.eq.Ingreso,tipo_cuenta.eq.Gasto,tipo_cuenta.eq.Costo")

  if (planError || !planCuentas?.length) {
    return vacio
  }

  const planMap: Record<
    string,
    { descripcion: string; tipo_cuenta: string; nivel: number; cuenta_padre: string | null }
  > = {}
  const cuentasResultadoSet = new Set<string>()
  for (const pc of planCuentas) {
    const tipoNorm = normalizarTipo(pc.tipo_cuenta || "")
    if (!TIPOS_RESULTADOS.includes(tipoNorm)) continue
    const n = Number(pc.nivel)
    planMap[pc.cuenta] = {
      descripcion: pc.descripcion || "",
      tipo_cuenta: tipoNorm,
      nivel: Number.isNaN(n) ? 1 : n,
      cuenta_padre: pc.cuenta_padre ?? null,
    }
    cuentasResultadoSet.add(pc.cuenta)
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

  const saldoTransaccional: Record<string, number> = {}
  for (const [cuenta, sumas] of Object.entries(sumasPorCuenta)) {
    const info = planMap[cuenta]
    if (!info) continue
    const saldo =
      info.tipo_cuenta === "Ingreso"
        ? sumas.haber - sumas.debe
        : sumas.debe - sumas.haber
    saldoTransaccional[cuenta] = saldo
  }

  // ——— TOTALES PUROS: solo saldos transaccionales (hojas), por primer dígito ———
  let total_ingresos = 0
  let total_costos = 0
  let total_gastos = 0
  for (const [cuenta, saldo] of Object.entries(saldoTransaccional)) {
    const grupo = clasificarPorCodigo(cuenta)
    if (grupo === "ingresos") total_ingresos += saldo
    else if (grupo === "costos") total_costos += saldo
    else if (grupo === "gastos") total_gastos += saldo
  }
  const utilidad_neta = total_ingresos - total_costos - total_gastos
  const totalesFijos: EstadoResultadosTotales = {
    total_ingresos,
    total_costos,
    total_gastos,
    utilidad_neta,
  }

  // ——— Roll-up: acumular hacia padres (incluye raíz 1 dígito 4, 5, 6) ———
  const saldoRolledUp: Record<string, number> = { ...saldoTransaccional }
  const todasCuentasOrdenadas = Object.keys(planMap).sort(
    (a, b) => (planMap[b].nivel - planMap[a].nivel) || a.localeCompare(b)
  )
  for (const cuenta of todasCuentasOrdenadas) {
    const saldo = saldoRolledUp[cuenta] ?? 0
    if (saldo === 0) continue
    const info = planMap[cuenta]
    const padre =
      info.cuenta_padre && cuentasResultadoSet.has(info.cuenta_padre)
        ? info.cuenta_padre
        : obtenerPadrePorCodigo(cuenta, cuentasResultadoSet)
    if (padre) {
      saldoRolledUp[padre] = (saldoRolledUp[padre] ?? 0) + saldo
    }
  }

  // Nivel a usar para filtrar: planMap o 1 para raíz virtual
  function nivelCuenta(c: string): number {
    const info = planMap[c]
    if (info) return info.nivel
    if (c.length === 1 && (c === "4" || c === "5" || c === "6")) return 1
    return 99
  }

  // ——— Armar listas: clasificación por primer dígito + solo nivel <= nivelMax ———
  const ingresos: EstadoResultadosFila[] = []
  const costos: EstadoResultadosFila[] = []
  const gastos: EstadoResultadosFila[] = []

  for (const cuenta of Object.keys(saldoRolledUp)) {
    const saldo = saldoRolledUp[cuenta]
    if (nivelCuenta(cuenta) > nivelMax) continue
    const grupo = clasificarPorCodigo(cuenta)
    if (!grupo) continue
    const info = planMap[cuenta]
    const descripcion = info
      ? info.descripcion
      : (RAICES_VIRTUALES[cuenta] || cuenta)
    const fila: EstadoResultadosFila = { cuenta, descripcion, saldo }
    if (grupo === "ingresos") ingresos.push(fila)
    else if (grupo === "costos") costos.push(fila)
    else gastos.push(fila)
  }

  ingresos.sort((a, b) => a.cuenta.localeCompare(b.cuenta))
  costos.sort((a, b) => a.cuenta.localeCompare(b.cuenta))
  gastos.sort((a, b) => a.cuenta.localeCompare(b.cuenta))

  return {
    ingresos,
    costos,
    gastos,
    totales: totalesFijos,
  }
}
