/**
 * Mock data centralizado para registros mensuales de Planillas
 * (Ingresos Mensuales / Descuentos Mensuales) - estilo ERP clásico
 */

export type EmpresaOption = { value: string; label: string }
export type RegionalOption = { value: string; label: string }
export type SucursalOption = { value: string; label: string }

export interface CabeceraPlanillasMensuales {
  periodo: number // ej: 202503
  empresa: string
  regional: string
  sucursal: string
}

export interface EmpleadoBase {
  codigo_empleado: string
  nombre_empleado: string
}

// Utilidad: string HH:MM (mock)
export type HoraMin = string

export interface IngresosMensualesRow extends EmpleadoBase {
  dias_trabajados: number
  horas_extras: HoraMin
  horas_dominical: HoraMin
  bono_produccion: number
  otros_ingresos: number
  subsidio_prenatal: number
  subsidio_natalidad: number
  subsidio_lactancia: number
}

export interface DescuentosMensualesRow extends EmpleadoBase {
  rc_iva_13: number
  faltas_dias: number
  atrasos: HoraMin
  anticipos: number
  prestamos: number
  retencion_judicial: number
}

export const catalogosPlanillasMensuales = {
  empresas: [
    { value: "001", label: "Empresa Principal" },
    { value: "002", label: "Sucursal Norte" },
  ] as EmpresaOption[],
  regionales: [
    { value: "01", label: "La Paz" },
    { value: "02", label: "Santa Cruz" },
    { value: "03", label: "Cochabamba" },
  ] as RegionalOption[],
  sucursales: [
    { value: "001", label: "Oficina Central" },
    { value: "002", label: "Sucursal Zona Sur" },
  ] as SucursalOption[],
}

export const cabeceraMockInicial: CabeceraPlanillasMensuales = {
  periodo: 202503,
  empresa: "001",
  regional: "01",
  sucursal: "001",
}

export const empleadosMock: EmpleadoBase[] = [
  { codigo_empleado: "EMP-001", nombre_empleado: "Juan Carlos García Morales" },
  { codigo_empleado: "EMP-002", nombre_empleado: "María Fernanda López Rojas" },
  { codigo_empleado: "EMP-003", nombre_empleado: "Carlos Andrés Pérez Aliaga" },
  { codigo_empleado: "EMP-004", nombre_empleado: "Sofía Elena Vargas Quiroga" },
]

export const ingresosMensualesMockInicial: IngresosMensualesRow[] = empleadosMock.map((e, idx) => ({
  ...e,
  dias_trabajados: 30 - (idx % 2),
  horas_extras: idx % 2 === 0 ? "02:30" : "00:00",
  horas_dominical: idx % 3 === 0 ? "01:00" : "00:00",
  bono_produccion: idx % 2 === 0 ? 350 : 0,
  otros_ingresos: idx % 3 === 0 ? 120 : 0,
  subsidio_prenatal: 0,
  subsidio_natalidad: 0,
  subsidio_lactancia: 0,
}))

export const descuentosMensualesMockInicial: DescuentosMensualesRow[] = empleadosMock.map((e, idx) => ({
  ...e,
  rc_iva_13: idx % 2 === 0 ? 180 : 0,
  faltas_dias: idx % 3 === 0 ? 1 : 0,
  atrasos: idx % 2 === 0 ? "00:30" : "00:00",
  anticipos: idx % 4 === 0 ? 300 : 0,
  prestamos: idx % 3 === 0 ? 250 : 0,
  retencion_judicial: 0,
}))


