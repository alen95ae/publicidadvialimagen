/**
 * Lógica compartida para Libro de Auxiliares (GET, Excel, PDF).
 * Comprobantes + comprobante_detalle (con auxiliar) + plan_cuentas (por cuenta código) + auxiliares.
 * Join auxiliar: comprobante_detalle.auxiliar puede ser código (nuevo) o nombre (legacy);
 * se resuelve por auxiliares.codigo primero y por auxiliares.nombre (case-insensitive, normalizado) como fallback.
 * Si no resuelve, se incluye igual el movimiento con auxiliar_codigo=null, auxiliar_nombre=texto tal cual, auxiliar_resuelto=false.
 *
 * SQL opcional para auxiliares no resolubles:
 *   select distinct cd.auxiliar
 *   from comprobante_detalle cd
 *   where cd.auxiliar is not null
 *     and not exists (select 1 from auxiliares a where a.codigo::text = cd.auxiliar or lower(trim(a.nombre)) = lower(trim(cd.auxiliar)));
 * Sugerencia: mapear aliases (ej. "bcp" -> "BANCO FORTALEZA") o crear auxiliares con codigo/nombre que coincidan.
 */

/** Normaliza texto para comparación: trim, minúsculas, espacios colapsados, sin acentos. */
function normalizarTexto(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

export interface LibroAuxiliaresParams {
  empresa_id?: string
  sucursal_id?: string
  clasificador?: string
  tipo_auxiliar?: string
  desde_auxiliar?: string
  hasta_auxiliar?: string
  desde_cuenta?: string
  hasta_cuenta?: string
  fecha_inicial?: string
  fecha_final?: string
  estado?: string
  moneda?: string
  tipo_reporte?: string
}

function getParam(params: LibroAuxiliaresParams | URLSearchParams, key: string): string {
  if (params instanceof URLSearchParams) {
    return params.get(key) || ""
  }
  return (params as any)[key] || ""
}

/** Objeto de diagnóstico: filtros efectivos y contadores por paso. */
export interface LibroAuxiliaresDebug {
  filtros_efectivos: {
    empresa_id: string
    sucursal_id: string
    estado: string
    fecha_inicial: string
    fecha_final: string
    tipo_auxiliar: string
    clasificador: string
    desde_cuenta: string
    hasta_cuenta: string
    desde_auxiliar: string
    hasta_auxiliar: string
    moneda: string
    tipo_reporte: string
    empresa_id_warning?: string
  }
  comprobantes_total: number
  detalles_total: number
  auxiliares_total: number
  mov_resueltos: number
  mov_no_resueltos: number
  mov_final: number
}

function buildDebug(
  partial: Partial<LibroAuxiliaresDebug> & { filtros_efectivos: LibroAuxiliaresDebug["filtros_efectivos"] }
): LibroAuxiliaresDebug {
  return {
    filtros_efectivos: partial.filtros_efectivos,
    comprobantes_total: partial.comprobantes_total ?? 0,
    detalles_total: partial.detalles_total ?? 0,
    auxiliares_total: partial.auxiliares_total ?? 0,
    mov_resueltos: partial.mov_resueltos ?? 0,
    mov_no_resueltos: partial.mov_no_resueltos ?? 0,
    mov_final: partial.mov_final ?? 0,
  }
}

export async function getDataLibroAuxiliares(
  supabase: any,
  params: LibroAuxiliaresParams | URLSearchParams
): Promise<{ data: any[]; tipo_reporte: "Detalle" | "Resumen"; debug: LibroAuxiliaresDebug }> {
  const empresa_id = getParam(params, "empresa_id")
  const sucursal_id = getParam(params, "sucursal_id")
  const clasificador = getParam(params, "clasificador")
  const tipo_auxiliar = getParam(params, "tipo_auxiliar")
  const desde_auxiliar = getParam(params, "desde_auxiliar")
  const hasta_auxiliar = getParam(params, "hasta_auxiliar")
  const desde_cuenta = getParam(params, "desde_cuenta")
  const hasta_cuenta = getParam(params, "hasta_cuenta")
  const fecha_inicial = getParam(params, "fecha_inicial")
  const fecha_final = getParam(params, "fecha_final")
  const estadoParam = getParam(params, "estado")
  const moneda = getParam(params, "moneda") || "BOB"
  const tipo_reporte = (getParam(params, "tipo_reporte") || "Detalle").toLowerCase() as "Detalle" | "Resumen"
  const estadoTodos = !estadoParam || estadoParam === "Todos"
  const estadoFiltro = estadoTodos ? "" : estadoParam.toUpperCase()

  const filtrosEfectivos: LibroAuxiliaresDebug["filtros_efectivos"] = {
    empresa_id,
    sucursal_id,
    estado: estadoTodos ? "Todos" : estadoFiltro,
    fecha_inicial,
    fecha_final,
    tipo_auxiliar,
    clasificador,
    desde_cuenta,
    hasta_cuenta,
    desde_auxiliar,
    hasta_auxiliar,
    moneda,
    tipo_reporte,
  }

  // comprobantes.empresa_id es INTEGER; frontend puede enviar UUID. Solo filtrar si es numérico.
  const empresaIdNum = Number(empresa_id)
  const empresaIdIsNumeric =
    !!empresa_id &&
    !Number.isNaN(empresaIdNum) &&
    String(empresaIdNum) === String(empresa_id).trim()

  let comprobantesQuery = supabase
    .from("comprobantes")
    .select("id, numero, fecha, concepto, estado, tipo_comprobante")
  if (empresa_id && empresa_id !== "todos" && empresa_id.toLowerCase() !== "todas") {
    if (empresaIdIsNumeric) {
      comprobantesQuery = comprobantesQuery.eq("empresa_id", empresaIdNum)
    } else {
      filtrosEfectivos.empresa_id_warning = "empresa_id_no_numeric_ignored"
    }
  }
  if (estadoFiltro) comprobantesQuery = comprobantesQuery.eq("estado", estadoFiltro)
  if (fecha_inicial) comprobantesQuery = comprobantesQuery.gte("fecha", fecha_inicial)
  if (fecha_final) comprobantesQuery = comprobantesQuery.lte("fecha", fecha_final)

  const { data: comprobantes, error: comprobantesError } = await comprobantesQuery
  const comprobantes_total = comprobantes?.length ?? 0
  if (comprobantesError || !comprobantes?.length) {
    const debug = buildDebug({ filtros_efectivos: filtrosEfectivos, comprobantes_total })
    console.log("[LibroAuxiliares debug]", JSON.stringify(debug, null, 2))
    return { data: [], tipo_reporte: "Detalle", debug }
  }

  const comprobanteIds = comprobantes.map((c: any) => c.id)
  let detallesQuery = supabase
    .from("comprobante_detalle")
    .select("comprobante_id, cuenta, auxiliar, glosa, debe_bs, haber_bs, debe_usd, haber_usd, orden")
    .in("comprobante_id", comprobanteIds)
    .not("auxiliar", "is", null)
  if (desde_cuenta) detallesQuery = detallesQuery.gte("cuenta", desde_cuenta)
  if (hasta_cuenta) detallesQuery = detallesQuery.lte("cuenta", hasta_cuenta)

  const { data: detalles, error: detallesError } = await detallesQuery
  const detalles_total = detalles?.length ?? 0
  if (detallesError || !detalles?.length) {
    const debug = buildDebug({
      filtros_efectivos: filtrosEfectivos,
      comprobantes_total,
      detalles_total,
    })
    console.log("[LibroAuxiliares debug]", JSON.stringify(debug, null, 2))
    return { data: [], tipo_reporte: "Detalle", debug }
  }

  // Join con plan_cuentas por comprobante_detalle.cuenta (código) = plan_cuentas.cuenta. No usar cuenta_id.
  const cuentaCodes = [...new Set(detalles.map((d: any) => d.cuenta))]
  let cuentasMap: Record<string, { descripcion: string; tipo_cuenta: string }> = {}
  if (cuentaCodes.length > 0) {
    const { data: cuentas } = await supabase
      .from("plan_cuentas")
      .select("cuenta, descripcion, tipo_cuenta")
      .in("cuenta", cuentaCodes)
    if (cuentas) {
      cuentas.forEach((c: any) => {
        cuentasMap[c.cuenta] = { descripcion: c.descripcion || "", tipo_cuenta: c.tipo_cuenta || "" }
      })
    }
  }

  // Cargar TODOS los auxiliares (sin filtro tipo_auxiliar) para resolver; luego se aplica filtro sobre resueltos.
  const auxiliaresQuery = supabase
    .from("auxiliares")
    .select("id, tipo_auxiliar, codigo, nombre")
    .eq("vigencia", true)
  const { data: auxiliaresList } = await auxiliaresQuery
  const auxiliares_total = auxiliaresList?.length ?? 0

  const byCodigo: Record<string, { codigo: string; tipo_auxiliar: string; nombre: string }> = {}
  const byNombreNormalizado: Record<string, { codigo: string; tipo_auxiliar: string; nombre: string }> = {}
  ;(auxiliaresList || []).forEach((a: any) => {
    const row = { codigo: a.codigo, tipo_auxiliar: a.tipo_auxiliar || "", nombre: a.nombre || "" }
    byCodigo[a.codigo] = row
    if (a.nombre) {
      const key = normalizarTexto(a.nombre)
      if (key && !byNombreNormalizado[key]) byNombreNormalizado[key] = row
    }
  })

  const comprobantesMap = comprobantes.reduce((acc: Record<number, any>, c: any) => {
    acc[c.id] = c
    return acc
  }, {})

  let mov_resueltos = 0
  let mov_no_resueltos = 0
  const movimientos: any[] = []
  for (const det of detalles) {
    const comp = comprobantesMap[det.comprobante_id]
    if (!comp) continue
    const auxVal = (det.auxiliar || "").trim()
    if (!auxVal) continue

    const aux = byCodigo[auxVal] || byNombreNormalizado[normalizarTexto(auxVal)]
    const resuelto = !!aux
    if (resuelto) mov_resueltos++
    else mov_no_resueltos++

    // Filtro tipo_auxiliar: solo descartar cuando está resuelto y no coincide. No resueltos pasan.
    if (resuelto && tipo_auxiliar && aux!.tipo_auxiliar !== tipo_auxiliar) continue
    if (resuelto && aux) {
      if (desde_auxiliar && aux.codigo < desde_auxiliar) continue
      if (hasta_auxiliar && aux.codigo > hasta_auxiliar) continue
    }
    // Para no resueltos, desde/hasta auxiliar no aplican por código; se dejan pasar.

    const info = cuentasMap[det.cuenta]
    const tipoCuenta = info?.tipo_cuenta || ""
    if (clasificador && clasificador !== "todos" && tipoCuenta.toLowerCase() !== clasificador.toLowerCase())
      continue

    const debe = moneda === "USD" ? Number(det.debe_usd || 0) : Number(det.debe_bs || 0)
    const haber = moneda === "USD" ? Number(det.haber_usd || 0) : Number(det.haber_bs || 0)
    movimientos.push({
      auxiliar_codigo: resuelto ? aux!.codigo : null,
      auxiliar_nombre: resuelto ? aux!.nombre : det.auxiliar,
      auxiliar_resuelto: resuelto,
      tipo_auxiliar: resuelto ? aux!.tipo_auxiliar : "",
      cuenta: det.cuenta,
      descripcion_cuenta: info?.descripcion || "",
      fecha: comp.fecha,
      numero_comprobante: comp.numero,
      tipo_comprobante: comp.tipo_comprobante || "",
      glosa_comprobante: comp.concepto || "",
      glosa_detalle: det.glosa || "",
      debe,
      haber,
      orden: det.orden || 0,
    })
  }

  const mov_final = movimientos.length

  movimientos.sort((a, b) => {
    const codA = a.auxiliar_codigo ?? a.auxiliar_nombre ?? ""
    const codB = b.auxiliar_codigo ?? b.auxiliar_nombre ?? ""
    if (codA !== codB) return String(codA).localeCompare(String(codB))
    if (a.cuenta !== b.cuenta) return a.cuenta.localeCompare(b.cuenta)
    if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha)
    return String(a.numero_comprobante).localeCompare(String(b.numero_comprobante))
  })

  const debug = buildDebug({
    filtros_efectivos: filtrosEfectivos,
    comprobantes_total,
    detalles_total,
    auxiliares_total,
    mov_resueltos,
    mov_no_resueltos,
    mov_final,
  })
  console.log("[LibroAuxiliares debug]", JSON.stringify(debug, null, 2))

  if (tipo_reporte === "resumen") {
    const data = buildLibroAuxiliarResumen(movimientos)
    return { data, tipo_reporte: "Resumen", debug }
  }
  const data = buildLibroAuxiliarDetalle(movimientos, fecha_inicial)
  return { data, tipo_reporte: "Detalle", debug }
}

/** Agrupa por auxiliar + cuenta y devuelve filas de resumen con saldo inicial/final. */
function buildLibroAuxiliarResumen(movimientos: any[]): any[] {
  let saldoActual = 0
  let keyAnterior = ""
  const movimientosConSaldo = movimientos.map((m: any) => {
    const key = `${m.auxiliar_codigo ?? m.auxiliar_nombre ?? ""}|${m.cuenta}`
    if (keyAnterior !== "" && keyAnterior !== key) saldoActual = 0
    keyAnterior = key
    saldoActual += m.debe - m.haber
    return { ...m, saldo: saldoActual }
  })
  const agrupado = new Map<
    string,
    {
      auxiliar_codigo: string | null
      auxiliar_nombre: string
      cuenta: string
      descripcion_cuenta: string
      total_debe: number
      total_haber: number
      saldo_final: number
    }
  >()
  for (const m of movimientosConSaldo) {
    const key = `${m.auxiliar_codigo ?? m.auxiliar_nombre ?? ""}|${m.cuenta}`
    const prev = agrupado.get(key)
    if (!prev) {
      agrupado.set(key, {
        auxiliar_codigo: m.auxiliar_codigo,
        auxiliar_nombre: m.auxiliar_nombre ?? "",
        cuenta: m.cuenta,
        descripcion_cuenta: m.descripcion_cuenta,
        total_debe: m.debe,
        total_haber: m.haber,
        saldo_final: m.saldo,
      })
    } else {
      prev.total_debe += m.debe
      prev.total_haber += m.haber
      prev.saldo_final = m.saldo
    }
  }
  return Array.from(agrupado.values()).map((r) => ({
    ...r,
    saldo_inicial: r.saldo_final - r.total_debe + r.total_haber,
  }))
}

/** Formatea fecha para texto "Saldo inicial al DD/MM/YYYY". */
function formatearFechaDesde(fecha: string): string {
  if (!fecha || !fecha.trim()) return ""
  try {
    const d = new Date(fecha)
    if (Number.isNaN(d.getTime())) return fecha
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return fecha
  }
}

/** Estructura tipo Libro Diario: agrupado por auxiliar → cuenta → movimientos con saldo acumulado y totales. */
export function buildLibroAuxiliarDetalle(
  movimientos: any[],
  fechaDesde?: string
): {
  auxiliares: Array<{
    auxiliar_codigo: string | null
    auxiliar_nombre: string
    cuentas: Array<{
      cuenta: string
      descripcion_cuenta: string
      saldo_inicial: number
      movimientos: Array<{
        fecha: string
        numero_comprobante: string | number
        tipo_comprobante: string
        glosa: string
        debe: number
        haber: number
        saldo: number
        es_saldo_inicial?: boolean
      }>
      total_debe: number
      total_haber: number
      saldo_final: number
    }>
    total_debe: number
    total_haber: number
    total_saldo: number
  }>
  total_general: { total_debe: number; total_haber: number; total_saldo: number }
} {
  const auxiliaresMap = new Map<
    string,
    {
      auxiliar_codigo: string | null
      auxiliar_nombre: string
      cuentasMap: Map<
        string,
        {
          cuenta: string
          descripcion_cuenta: string
          movimientos: any[]
          total_debe: number
          total_haber: number
          saldo_final: number
          saldo_inicial: number
        }
      >
      total_debe: number
      total_haber: number
      total_saldo: number
    }
  >()

  for (const m of movimientos) {
    const auxKey = `${m.auxiliar_codigo ?? m.auxiliar_nombre ?? ""}`
    let auxBlock = auxiliaresMap.get(auxKey)
    if (!auxBlock) {
      auxBlock = {
        auxiliar_codigo: m.auxiliar_codigo,
        auxiliar_nombre: m.auxiliar_nombre ?? "",
        cuentasMap: new Map(),
        total_debe: 0,
        total_haber: 0,
        total_saldo: 0,
      }
      auxiliaresMap.set(auxKey, auxBlock)
    }

    let cuentaBlock = auxBlock.cuentasMap.get(m.cuenta)
    if (!cuentaBlock) {
      cuentaBlock = {
        cuenta: m.cuenta,
        descripcion_cuenta: m.descripcion_cuenta || "",
        movimientos: [],
        total_debe: 0,
        total_haber: 0,
        saldo_final: 0,
        saldo_inicial: 0,
      }
      auxBlock.cuentasMap.set(m.cuenta, cuentaBlock)
    }

    // Saldo acumulado progresivo: saldo_actual = saldo_anterior + debe - haber (orden cronológico)
    const saldoAnterior =
      cuentaBlock.movimientos.length === 0
        ? cuentaBlock.saldo_inicial
        : (cuentaBlock.movimientos[cuentaBlock.movimientos.length - 1] as any).saldo
    const saldoActual = saldoAnterior + m.debe - m.haber

    cuentaBlock.movimientos.push({
      fecha: m.fecha,
      numero_comprobante: m.numero_comprobante,
      tipo_comprobante: m.tipo_comprobante || "",
      glosa: (m.glosa_comprobante || m.glosa_detalle || "").trim(),
      debe: m.debe,
      haber: m.haber,
      saldo: saldoActual,
    })
    cuentaBlock.total_debe += m.debe
    cuentaBlock.total_haber += m.haber
    cuentaBlock.saldo_final = saldoActual
    auxBlock.total_debe += m.debe
    auxBlock.total_haber += m.haber
  }

  const fechaDesdeFormato = formatearFechaDesde(fechaDesde || "")

  // Calcular total_saldo por auxiliar e insertar fila "Saldo inicial" al inicio de cada cuenta
  const auxiliares = Array.from(auxiliaresMap.values()).map((auxBlock) => {
    let totalSaldoAux = 0
    const cuentas = Array.from(auxBlock.cuentasMap.values()).map((c) => {
      totalSaldoAux += c.saldo_final
      const saldoInicial = c.saldo_inicial ?? 0
      const filaSaldoInicial = {
        fecha: fechaDesde || "",
        numero_comprobante: "" as string | number,
        tipo_comprobante: "",
        glosa: fechaDesdeFormato ? `Saldo inicial al ${fechaDesdeFormato}` : "Saldo inicial",
        debe: 0,
        haber: 0,
        saldo: saldoInicial,
        es_saldo_inicial: true as const,
      }
      const movimientosConInicial = [filaSaldoInicial, ...c.movimientos]
      return {
        cuenta: c.cuenta,
        descripcion_cuenta: c.descripcion_cuenta,
        saldo_inicial: saldoInicial,
        movimientos: movimientosConInicial,
        total_debe: c.total_debe,
        total_haber: c.total_haber,
        saldo_final: c.saldo_final,
      }
    })
    return {
      auxiliar_codigo: auxBlock.auxiliar_codigo,
      auxiliar_nombre: auxBlock.auxiliar_nombre,
      cuentas,
      total_debe: auxBlock.total_debe,
      total_haber: auxBlock.total_haber,
      total_saldo: totalSaldoAux,
    }
  })

  const total_general = auxiliares.reduce(
    (acc, aux) => ({
      total_debe: acc.total_debe + aux.total_debe,
      total_haber: acc.total_haber + aux.total_haber,
      total_saldo: acc.total_saldo + aux.total_saldo,
    }),
    { total_debe: 0, total_haber: 0, total_saldo: 0 }
  )

  return { auxiliares, total_general }
}
