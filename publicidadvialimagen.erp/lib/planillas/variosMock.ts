/**
 * Mock data centralizado para Planillas:
 * - Ingresos/Descuentos Varios
 * - Justificativos de Inasistencias
 */

import { empleadosMock, cabeceraMockInicial, type CabeceraPlanillasMensuales } from "./mensualesMock"

export type TipoMovimientoVarios = "INGRESOS" | "DESCUENTOS"

export interface IngresosDescuentosVariosRow {
  codigo_empleado: string
  nombre_empleado: string
  detalle: string
  monto: number
  tipo: TipoMovimientoVarios
}

export type TipoInasistencia = "Falta" | "Licencia" | "Vacación" | "Baja Médica" | "Otro"

export interface JustificativoInasistenciaRow {
  codigo_empleado: string
  nombre_empleado: string
  de_fecha: string
  a_fecha: string
  tipo_inasistencia: TipoInasistencia
}

export const cabeceraVariosMockInicial: CabeceraPlanillasMensuales = cabeceraMockInicial

export const ingresosDescuentosVariosMockInicial: IngresosDescuentosVariosRow[] = [
  {
    codigo_empleado: empleadosMock[0].codigo_empleado,
    nombre_empleado: empleadosMock[0].nombre_empleado,
    detalle: "Bono puntualidad (mock)",
    monto: 150,
    tipo: "INGRESOS",
  },
  {
    codigo_empleado: empleadosMock[1].codigo_empleado,
    nombre_empleado: empleadosMock[1].nombre_empleado,
    detalle: "Descuento por daño (mock)",
    monto: 80.5,
    tipo: "DESCUENTOS",
  },
  {
    codigo_empleado: empleadosMock[2].codigo_empleado,
    nombre_empleado: empleadosMock[2].nombre_empleado,
    detalle: "Otros ingresos (mock)",
    monto: 220,
    tipo: "INGRESOS",
  },
]

export const justificativosInasistenciasMockInicial: JustificativoInasistenciaRow[] = [
  {
    codigo_empleado: empleadosMock[0].codigo_empleado,
    nombre_empleado: empleadosMock[0].nombre_empleado,
    de_fecha: "2025-03-05",
    a_fecha: "2025-03-05",
    tipo_inasistencia: "Licencia",
  },
  {
    codigo_empleado: empleadosMock[3].codigo_empleado,
    nombre_empleado: empleadosMock[3].nombre_empleado,
    de_fecha: "2025-03-10",
    a_fecha: "2025-03-12",
    tipo_inasistencia: "Baja Médica",
  },
]

export const catalogosVarios = {
  tiposMovimiento: ["INGRESOS", "DESCUENTOS"] as TipoMovimientoVarios[],
  tiposInasistencia: ["Falta", "Licencia", "Vacación", "Baja Médica", "Otro"] as TipoInasistencia[],
}


