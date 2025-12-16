import { empleadosMock } from "./mensualesMock"

export type MarcaAsistencia = "Entrada" | "Salida"
export type ES = "E" | "S"

export interface AsistenciaRow {
  fecha: string
  hora: number
  minuto: number
  marca: MarcaAsistencia
  es: ES
}

export interface BiometricoLogRow {
  codigo: string
  marcado: string
  fecha: string
  hora: number
  minuto: number
}

export const filtrosAsistenciaMockInicial = {
  codigo_empleado: empleadosMock[0].codigo_empleado,
  de_fecha: "2025-03-01",
  a_fecha: "2025-03-10",
}

export const asistenciaMockInicial: AsistenciaRow[] = [
  { fecha: "2025-03-01", hora: 8, minuto: 2, marca: "Entrada", es: "E" },
  { fecha: "2025-03-01", hora: 18, minuto: 5, marca: "Salida", es: "S" },
  { fecha: "2025-03-02", hora: 8, minuto: 0, marca: "Entrada", es: "E" },
  { fecha: "2025-03-02", hora: 17, minuto: 58, marca: "Salida", es: "S" },
]

export const biometricoMockInicial: BiometricoLogRow[] = [
  { codigo: empleadosMock[0].codigo_empleado, marcado: "OK", fecha: "2025-03-01", hora: 8, minuto: 2 },
  { codigo: empleadosMock[0].codigo_empleado, marcado: "OK", fecha: "2025-03-01", hora: 18, minuto: 5 },
  { codigo: empleadosMock[1].codigo_empleado, marcado: "OK", fecha: "2025-03-01", hora: 8, minuto: 15 },
  { codigo: empleadosMock[1].codigo_empleado, marcado: "OK", fecha: "2025-03-01", hora: 18, minuto: 1 },
]

export const catalogosAsistencias = {
  marcas: ["Entrada", "Salida"] as MarcaAsistencia[],
  es: ["E", "S"] as ES[],
}


