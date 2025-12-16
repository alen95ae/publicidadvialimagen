export type EstadoPeriodo = "Abierta" | "Cerrada"
export type TipoCalculoFila = "Sin Porcentaje" | "Con Porcentaje %"

export type IngresoVarioRow = {
  id: string
  tipo: string
  valor: number
  tipoCalculo: TipoCalculoFila
}

export type DescuentoVarioRow = {
  id: string
  tipo: string
  valor: number
  tipoCalculo: TipoCalculoFila
}

export type CalculoPlanillasFormState = {
  // Bloque 1
  periodo: number
  desdeFecha: string
  hastaFecha: string
  estado: EstadoPeriodo
  basicoNacional: number
  diasTrabajados: number

  // Datos de cotización
  cotizacionUsdAnterior: number
  cotizacionUsdActual: number
  ufvAnterior: number
  ufvActual: number

  // Campo adicional
  nroComprobante: string

  // Bloque informativo (solo lectura)
  empresa: string
  regional: string
  sucursal: string

  // Bloque 2
  porcentajeRcIva: number
  porcentajeAportesCns: number

  // Bloque 3
  ingresosVarios: IngresoVarioRow[]
  descuentosVarios: DescuentoVarioRow[]

  // Estado simulado
  calculoSimulado: {
    ultimoCalculoAt: string | null
    guardadoAt: string | null
  }
}

export const TIPO_INGRESOS_MOCK = [
  "Bono Antigüedad",
  "Bono Producción",
  "Horas Extra",
  "Reintegro",
] as const

export const TIPO_DESCUENTOS_MOCK = [
  "Préstamo",
  "Multa",
  "Descuento Alimentación",
  "Otros",
] as const

export function getDefaultCalculoPlanillasState(): CalculoPlanillasFormState {
  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = String(hoy.getMonth() + 1).padStart(2, "0")
  const dd = String(hoy.getDate()).padStart(2, "0")
  const iso = `${yyyy}-${mm}-${dd}`

  return {
    periodo: Number(`${yyyy}${mm}`),
    desdeFecha: iso,
    hastaFecha: iso,
    estado: "Abierta",
    basicoNacional: 2500,
    diasTrabajados: 30,

    cotizacionUsdAnterior: 6.90,
    cotizacionUsdActual: 6.96,
    ufvAnterior: 2.52,
    ufvActual: 2.53,

    nroComprobante: "",

    empresa: "PUBLICIDAD VIAL IMAGEN S.R.L.",
    regional: "01 - Central",
    sucursal: "001 - Principal",

    porcentajeRcIva: 13,
    porcentajeAportesCns: 10,

    ingresosVarios: [
      { id: "ing-1", tipo: "Bono Producción", valor: 350, tipoCalculo: "Sin Porcentaje" },
      { id: "ing-2", tipo: "Horas Extra", valor: 15, tipoCalculo: "Con Porcentaje %" },
    ],
    descuentosVarios: [
      { id: "des-1", tipo: "Préstamo", valor: 200, tipoCalculo: "Sin Porcentaje" },
      { id: "des-2", tipo: "Otros", valor: 5, tipoCalculo: "Con Porcentaje %" },
    ],

    calculoSimulado: {
      ultimoCalculoAt: null,
      guardadoAt: null,
    },
  }
}


