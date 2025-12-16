export type EstadoPlanilla = "Abierta" | "Cerrada"
export type TipoCuenta = "DEBE" | "HABER"

export interface DatosPlanillaParametros {
  periodo: string
  fecha_desde: string
  fecha_hasta: string
  estado: EstadoPlanilla
  basico_nacional: number
  dias_trabajados: number
  cotizacion_sus_anterior: number
  cotizacion_sus_actual: number
  ufv_anterior: number
  ufv_actual: number
  rc_iva_pct: number
  aportes_cns_pct: number
  aportes_fonvi_pct: number
}

export interface CuentaPlanillaRow {
  id: string
  indice: number
  clasificador: string
  cuenta_contable: string
  codigo: string
  tipo_cuenta: TipoCuenta
}

export interface FirmaPlanillaRow {
  id: string
  numero: number
  codigo: string
  nombre: string
  cargo: string
}

export const datosPlanillasMockInicial: {
  parametros: DatosPlanillaParametros
  cuentas: CuentaPlanillaRow[]
  firmas: FirmaPlanillaRow[]
} = {
  parametros: {
    periodo: "202503",
    fecha_desde: "2025-03-01",
    fecha_hasta: "2025-03-31",
    estado: "Abierta",
    basico_nacional: 2500,
    dias_trabajados: 30,
    cotizacion_sus_anterior: 2.31,
    cotizacion_sus_actual: 2.34,
    ufv_anterior: 2.46,
    ufv_actual: 2.47,
    rc_iva_pct: 13,
    aportes_cns_pct: 10,
    aportes_fonvi_pct: 2,
  },
  cuentas: [
    {
      id: "1",
      indice: 1,
      clasificador: "SUELDOS",
      cuenta_contable: "5-01-01",
      codigo: "PL-SUELDOS",
      tipo_cuenta: "DEBE",
    },
    {
      id: "2",
      indice: 2,
      clasificador: "APORTES",
      cuenta_contable: "2-01-05",
      codigo: "PL-APORTES",
      tipo_cuenta: "HABER",
    },
  ],
  firmas: [
    { id: "1", numero: 1, codigo: "FIR-001", nombre: "Juan Pérez", cargo: "Gerente General" },
    { id: "2", numero: 2, codigo: "FIR-002", nombre: "María López", cargo: "Jefe de RRHH" },
  ],
}

export const catalogosDatosPlanillas = {
  estados: ["Abierta", "Cerrada"] as EstadoPlanilla[],
  tiposCuenta: ["DEBE", "HABER"] as TipoCuenta[],
}


