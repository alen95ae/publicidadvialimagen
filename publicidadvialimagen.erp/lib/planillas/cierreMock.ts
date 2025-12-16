import { cabeceraMockInicial, type CabeceraPlanillasMensuales } from "./mensualesMock"

export type EstadoCierre = "ABIERTA" | "CERRADA"
export type TipoValor = "SIN PORCENTAJE" | "CON PORCENTAJE %"

export interface CierreMensualForm {
  cabecera: CabeceraPlanillasMensuales & {
    de_fecha: string
    a_fecha: string
    estado: EstadoCierre
  }
  informativo: {
    basico_nacional: number
    dias_trabajados: number
    cotizacion_sus_anterior: number
    cotizacion_sus_actual: number
    ufv_anterior: number
    ufv_actual: number
  }
  descuentos_aportes: {
    rc_iva_pct: number
    aportes_cns_pct: number
    aportes_fonvi_pct: number
  }
  ingresos_varios: Array<{
    tipo_ingreso: string
    valor: number
    tipo: TipoValor
  }>
  descuentos_varios: Array<{
    tipo_descuento: string
    valor: number
    tipo: TipoValor
  }>
}

export const cierreMensualMockInicial: CierreMensualForm = {
  cabecera: {
    ...cabeceraMockInicial,
    de_fecha: "2025-03-01",
    a_fecha: "2025-03-31",
    estado: "ABIERTA",
  },
  informativo: {
    basico_nacional: 2500,
    dias_trabajados: 30,
    cotizacion_sus_anterior: 2.31,
    cotizacion_sus_actual: 2.34,
    ufv_anterior: 2.46,
    ufv_actual: 2.47,
  },
  descuentos_aportes: {
    rc_iva_pct: 13,
    aportes_cns_pct: 10,
    aportes_fonvi_pct: 2,
  },
  ingresos_varios: [
    { tipo_ingreso: "Bono General (mock)", valor: 200, tipo: "SIN PORCENTAJE" },
    { tipo_ingreso: "Incremento (mock)", valor: 5, tipo: "CON PORCENTAJE %" },
  ],
  descuentos_varios: [
    { tipo_descuento: "Descuento General (mock)", valor: 50, tipo: "SIN PORCENTAJE" },
  ],
}

export const catalogosCierre = {
  estados: ["ABIERTA", "CERRADA"] as EstadoCierre[],
  tipoValor: ["SIN PORCENTAJE", "CON PORCENTAJE %"] as TipoValor[],
}


