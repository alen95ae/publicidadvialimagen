// Types para el módulo de Contabilidad - Plan de Cuentas y Auxiliares

export interface Cuenta {
  id: number
  empresa_id: number
  clasificador: string
  cuenta: string
  descripcion: string
  cuenta_padre?: string | null
  nivel: number
  tipo_cuenta: string
  moneda: string
  permite_auxiliar?: boolean
  cuenta_presupuestaria: boolean
  cuenta_patrimonial: boolean
  efectivo: boolean
  cuenta_flujo: boolean
  aitb: boolean
  transaccional: boolean
  vigente: boolean
  created_at?: string
  updated_at?: string
}

export interface CuentaSaldos {
  gestion: string
  inicial: number
  debe: number
  haber: number
  saldo: number
}

export interface Auxiliar {
  id: string
  tipo_auxiliar: string
  codigo: string
  nombre: string
  cuenta_asociada?: string
  moneda: string
  cuenta_bancaria_o_caja: boolean
  departamento?: string
  direccion?: string
  telefono?: string
  email?: string
  nit?: string
  autorizacion?: string
  vigencia: boolean
  created_at?: string
  updated_at?: string
}

export interface AuxiliarSaldos {
  gestion: string
  saldo: number
}

export type TipoCuenta = 
  | "Activo"
  | "Pasivo"
  | "Patrimonio"
  | "Ingresos"
  | "Gastos"
  | "Costos"

export type TipoAuxiliar = 
  | "Cliente"
  | "Proveedor"
  | "Banco"
  | "Caja"
  | "Empleado"
  | "Otro"

export type Moneda = "BS" | "USD"

export interface PlanCuentasFilters {
  clasificador?: string
  cuenta?: string
  descripcion?: string
  moneda?: Moneda
  nivel?: number
  vigencia?: boolean
  transaccional?: boolean
}

export interface AuxiliaresFilters {
  tipo_auxiliar?: TipoAuxiliar
  codigo?: string
  nombre?: string
  moneda?: Moneda
  vigencia?: boolean
}

// Types para Comprobantes (Asientos Contables)
export interface ComprobanteDetalle {
  id?: number
  comprobante_id?: number
  cuenta: string
  auxiliar?: string | null
  lc?: boolean
  glosa?: string | null
  nro_ot?: string | null
  debe_bs: number
  haber_bs: number
  debe_usd: number
  haber_usd: number
  orden?: number
}

export interface Comprobante {
  id: number
  numero: string
  origen: "Contabilidad" | "Ventas" | "Tesorería" | "Activos" | "Planillas"
  tipo_comprobante: "Ingreso" | "Egreso" | "Diario" | "Traspaso" | "Ctas por Pagar"
  tipo_asiento: "Normal" | "Apertura" | "Cierre" | "Ajuste"
  fecha: string
  periodo: number // 1-12 (mes)
  gestion: number // año
  moneda: Moneda
  tipo_cambio: number
  concepto?: string | null
  beneficiario?: string | null
  nro_cheque?: string | null
  estado: "BORRADOR" | "APROBADO"
  empresa_id?: number
  created_at?: string
  updated_at?: string
  detalles?: ComprobanteDetalle[]
}

export type OrigenComprobante = "Contabilidad" | "Ventas" | "Tesorería" | "Activos" | "Planillas"
export type TipoComprobante = "Ingreso" | "Egreso" | "Diario" | "Traspaso" | "Ctas por Pagar" | "Apertura"
export type TipoAsiento = "Normal" | "Apertura" | "Cierre" | "Ajuste"
export type EstadoComprobante = "BORRADOR" | "APROBADO"

// Interface para Asiento de Apertura
export interface AsientoAperturaInput {
  empresa_id: number
  gestion: number
  cotizacion: number
  fecha: string
  glosa?: string
}

// Types para Presupuestos
export interface Presupuesto {
  id: number
  empresa_id: number
  gestion: number // año
  cuenta: string // código contable (string)
  tipo_cambio: number
  aprobado: boolean
  enero: number
  febrero: number
  marzo: number
  abril: number
  mayo: number
  junio: number
  julio: number
  agosto: number
  septiembre: number
  octubre: number
  noviembre: number
  diciembre: number
  total?: number // calculado en DB, solo lectura
  created_at?: string
  updated_at?: string
}

export interface PresupuestosFilters {
  gestion?: number
  cuenta?: string
  aprobado?: boolean
}

// Types para Parámetros de Contabilidad
export interface Empresa {
  id: string
  codigo: string
  nombre: string
  representante?: string | null
  direccion?: string | null
  casilla?: string | null
  telefonos?: string | null
  email?: string | null
  pais?: string | null
  ciudad?: string | null
  localidad?: string | null
  nit?: string | null
  created_at?: string
  updated_at?: string
}

