/**
 * Estado de Auxiliares (Resumen).
 * Por cada (auxiliar, cuenta): Saldo Anterior (histórico hasta fecha_inicial-1),
 * movimientos del periodo (total_debe, total_haber), Saldo Actual.
 * Naturaleza: Activo/Gasto/Costo -> Debe - Haber; Pasivo/Patrimonio/Ingreso -> Haber - Debe.
 */
export interface EstadoAuxiliaresFila {
  auxiliar_codigo: string | null
  auxiliar_nombre: string
  cuenta_codigo: string
  cuenta_descripcion: string
  saldo_anterior: number
  total_debe: number
  total_haber: number
  saldo_actual: number
}

export interface EstadoAuxiliaresData {
  resultados: EstadoAuxiliaresFila[]
}

const TIPOS_DEUDOR = ["Activo", "Gasto", "Costo"]

function normalizarTipo(t: string): string {
  if (!t || !t.trim()) return ""
  const s = t.trim()
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function normalizarTexto(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

export async function getDataEstadoAuxiliares(
  supabase: any,
  params: {
    empresa_id?: string
    sucursal_id?: string
    clasificador?: string
    desde_cuenta?: string
    hasta_cuenta?: string
    desde_auxiliar?: string
    hasta_auxiliar?: string
    fecha_inicial: string
    fecha_final: string
    estado?: string
    moneda?: string
  }
): Promise<EstadoAuxiliaresData> {
  const {
    empresa_id = "",
    sucursal_id = "",
    desde_cuenta = "",
    hasta_cuenta = "",
    desde_auxiliar = "",
    hasta_auxiliar = "",
    fecha_inicial,
    fecha_final,
    estado: estadoParam = "Aprobado",
    moneda = "BOB",
  } = params

  const estadoFiltro =
    estadoParam && estadoParam !== "Todos" ? String(estadoParam).toUpperCase() : null
  const useUsd = moneda === "USD"

  const vacio: EstadoAuxiliaresData = { resultados: [] }
  if (!fecha_inicial || !fecha_final) return vacio

  // 1) Comprobantes: fecha <= fecha_final, empresa_uuid, sucursal_id, estado (si no es Todos)
  let comprobantesQuery = supabase
    .from("comprobantes")
    .select("id, fecha")
    .lte("fecha", fecha_final)
  if (estadoFiltro) comprobantesQuery = comprobantesQuery.eq("estado", estadoFiltro)

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

  const { data: comprobantes, error: errComp } = await comprobantesQuery
  if (errComp || !comprobantes?.length) return vacio

  const comprobanteIds = comprobantes.map((c: any) => c.id)
  const comprobantesMap = comprobantes.reduce((acc: Record<number, { fecha: string }>, c: any) => {
    acc[c.id] = { fecha: c.fecha }
    return acc
  }, {})

  // 2) comprobante_detalle: solo líneas con auxiliar no nulo/vacío; filtro cuenta
  let detallesQuery = supabase
    .from("comprobante_detalle")
    .select("comprobante_id, cuenta, auxiliar, debe_bs, haber_bs, debe_usd, haber_usd")
    .in("comprobante_id", comprobanteIds)
    .not("auxiliar", "is", null)

  if (desde_cuenta && desde_cuenta.trim()) detallesQuery = detallesQuery.gte("cuenta", desde_cuenta.trim())
  if (hasta_cuenta && hasta_cuenta.trim()) detallesQuery = detallesQuery.lte("cuenta", hasta_cuenta.trim())

  const { data: detalles, error: errDet } = await detallesQuery
  if (errDet || !detalles?.length) return vacio

  const detallesConAux = (detalles as any[]).filter((d) => (d.auxiliar ?? "").toString().trim() !== "")
  if (detallesConAux.length === 0) return vacio

  const cuentaCodes = [...new Set(detallesConAux.map((d: any) => d.cuenta))]
  const { data: planCuentas } = await supabase
    .from("plan_cuentas")
    .select("cuenta, descripcion, tipo_cuenta")
    .in("cuenta", cuentaCodes)

  const planMap: Record<string, { descripcion: string; tipo_cuenta: string }> = {}
  ;(planCuentas || []).forEach((pc: any) => {
    planMap[pc.cuenta] = {
      descripcion: pc.descripcion || "",
      tipo_cuenta: (pc.tipo_cuenta || "").trim(),
    }
  })

  const { data: auxiliaresList } = await supabase
    .from("auxiliares")
    .select("codigo, nombre")
    .eq("vigencia", true)
  const byCodigo: Record<string, string> = {}
  const byNombreNorm: Record<string, string> = {}
  ;(auxiliaresList || []).forEach((a: any) => {
    const cod = a.codigo != null ? String(a.codigo) : ""
    if (cod) byCodigo[cod] = a.nombre || ""
    if (a.nombre) {
      const key = normalizarTexto(a.nombre)
      if (key && !byNombreNorm[key]) byNombreNorm[key] = cod
    }
  })

  type GrupoKey = string
  type Grupo = {
    auxiliar_raw: string
    auxiliar_codigo: string | null
    auxiliar_nombre: string
    cuenta: string
    cuenta_descripcion: string
    tipo_cuenta: string
    saldo_anterior: number
    total_debe: number
    total_haber: number
  }
  const grupos = new Map<GrupoKey, Grupo>()

  for (const det of detallesConAux) {
    const auxRaw = (det.auxiliar ?? "").toString().trim()
    const comp = comprobantesMap[det.comprobante_id]
    if (!comp) continue
    const fecha = comp.fecha
    const cuenta = (det.cuenta ?? "").toString().trim()
    const info = planMap[cuenta] || { descripcion: "", tipo_cuenta: "" }
    const tipoNorm = normalizarTipo(info.tipo_cuenta)
    const esDeudor = TIPOS_DEUDOR.includes(tipoNorm)

    const debe = useUsd ? Number(det.debe_usd || 0) : Number(det.debe_bs || 0)
    const haber = useUsd ? Number(det.haber_usd || 0) : Number(det.haber_bs || 0)
    const delta = esDeudor ? debe - haber : haber - debe

    const auxCodigo = byCodigo[auxRaw] !== undefined ? auxRaw : byNombreNorm[normalizarTexto(auxRaw)] ?? null
    const auxNombre = auxCodigo ? (byCodigo[auxCodigo] ?? auxRaw) : auxRaw
    const key: GrupoKey = `${auxCodigo ?? auxRaw}|${cuenta}`

    let g = grupos.get(key)
    if (!g) {
      g = {
        auxiliar_raw: auxRaw,
        auxiliar_codigo: auxCodigo,
        auxiliar_nombre: auxNombre,
        cuenta,
        cuenta_descripcion: info.descripcion,
        tipo_cuenta: tipoNorm,
        saldo_anterior: 0,
        total_debe: 0,
        total_haber: 0,
      }
      grupos.set(key, g)
    }

    if (fecha < fecha_inicial) {
      g.saldo_anterior += delta
    } else {
      g.total_debe += debe
      g.total_haber += haber
    }
  }

  const resultados: EstadoAuxiliaresFila[] = []
  for (const g of grupos.values()) {
    const esDeudor = TIPOS_DEUDOR.includes(g.tipo_cuenta)
    const deltaPeriodo = esDeudor ? g.total_debe - g.total_haber : g.total_haber - g.total_debe
    const saldo_actual = g.saldo_anterior + deltaPeriodo

    if (
      g.saldo_anterior === 0 &&
      g.total_debe === 0 &&
      g.total_haber === 0 &&
      saldo_actual === 0
    ) continue

    if (desde_auxiliar && desde_auxiliar.trim()) {
      const cod = g.auxiliar_codigo ?? g.auxiliar_raw
      if (String(cod).trim() < desde_auxiliar.trim()) continue
    }
    if (hasta_auxiliar && hasta_auxiliar.trim()) {
      const cod = g.auxiliar_codigo ?? g.auxiliar_raw
      if (String(cod).trim() > hasta_auxiliar.trim()) continue
    }

    resultados.push({
      auxiliar_codigo: g.auxiliar_codigo,
      auxiliar_nombre: g.auxiliar_nombre,
      cuenta_codigo: g.cuenta,
      cuenta_descripcion: g.cuenta_descripcion,
      saldo_anterior: g.saldo_anterior,
      total_debe: g.total_debe,
      total_haber: g.total_haber,
      saldo_actual,
    })
  }

  resultados.sort((a, b) => {
    const auxA = a.auxiliar_codigo ?? a.auxiliar_nombre
    const auxB = b.auxiliar_codigo ?? b.auxiliar_nombre
    if (auxA !== auxB) return String(auxA).localeCompare(String(auxB))
    return a.cuenta_codigo.localeCompare(b.cuenta_codigo)
  })

  return { resultados }
}
