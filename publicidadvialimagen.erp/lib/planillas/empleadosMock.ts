/**
 * Mock data centralizado para Registro de Empleados
 * Estilo ERP clásico (tipo GSOFT)
 */

export type EstadoEmpleado = "Alta" | "Baja" | "Pendiente"
export type Sexo = "Masculino" | "Femenino" | "Otro"
export type EstadoCivil = "Soltero/a" | "Casado/a" | "Divorciado/a" | "Viudo/a"
export type TipoContrato = "Plazo Fijo" | "Indefinido" | "Eventual" | "Consultoría"
export type CalificacionContrato = "Profesional" | "Técnico" | "Administrativo" | "Operativo"
export type EstadoContrato = "Pendiente" | "Alta" | "Concluido" | "Baja"
export type Parentesco = "Hijo/a" | "Cónyuge" | "Padre" | "Madre" | "Hermano/a" | "Otro"

export interface DatosGenerales {
  codigo: string
  apellido_paterno: string
  apellido_materno: string
  nombres: string
  fecha_nacimiento: string
  nacionalidad: string
  direccion: string
  sexo: Sexo
  estado_civil: EstadoCivil
  numero_ci: string
  grupo_sanguineo: string
  grado_academico: string
  profesion: string
  idiomas: string
  telefono: string
  celular: string
  email: string
  casilla: string
  fecha_ingreso: string
  numero_planilla: string
  haber_basico: number
  numero_cuenta_bancaria: string
  afp: string
  activo_jubilado: "Activo" | "Jubilado"
  empresa: string
  regional: string
  sucursal: string
  centro_costo: string
  cargo: string
  estado: EstadoEmpleado
}

export interface Contrato {
  numero_contrato: string
  codigo_empleado: string
  empresa: string
  regional: string
  sucursal: string
  haber_basico: number
  cargo: string
  centro_costo: string
  tipo_contrato: TipoContrato
  calificacion: CalificacionContrato
  fecha_inicio: string
  fecha_termino: string
  detalle_contrato: string
  estado: EstadoContrato
}

export interface Complementarios {
  referente_nombres: string
  referente_ci: string
  referente_direccion: string
  referente_telefono: string
  observaciones: string
}

export interface Dependiente {
  id: string
  nombre: string
  cedula_identidad: string
  fecha_nacimiento: string
  parentesco: Parentesco
  sexo: Sexo
  nacionalidad: string
  beneficiario: boolean
}

export interface EmpleadoCompleto {
  datos_generales: DatosGenerales
  contratos: Contrato[]
  complementarios: Complementarios
  dependientes: {
    nombre_conyuge: string
    nombre_padre: string
    nombre_madre: string
    lista_dependientes: Dependiente[]
  }
}

// Datos mock iniciales
export const empleadoMockInicial: EmpleadoCompleto = {
  datos_generales: {
    codigo: "EMP-001",
    apellido_paterno: "García",
    apellido_materno: "Morales",
    nombres: "Juan Carlos",
    fecha_nacimiento: "1985-03-15",
    nacionalidad: "Boliviana",
    direccion: "Av. Arce #1234, La Paz",
    sexo: "Masculino",
    estado_civil: "Casado/a",
    numero_ci: "5678901 LP",
    grupo_sanguineo: "O+",
    grado_academico: "Licenciatura",
    profesion: "Contador",
    idiomas: "Español, Inglés",
    telefono: "2-2334455",
    celular: "71234567",
    email: "jgarcia@empresa.com",
    casilla: "1234",
    fecha_ingreso: "2020-01-15",
    numero_planilla: "PL-001",
    haber_basico: 5000,
    numero_cuenta_bancaria: "1234567890",
    afp: "Futuro de Bolivia",
    activo_jubilado: "Activo",
    empresa: "001",
    regional: "01",
    sucursal: "001",
    centro_costo: "CC-001",
    cargo: "Contador Senior",
    estado: "Alta"
  },
  contratos: [
    {
      numero_contrato: "CONT-001-2020",
      codigo_empleado: "EMP-001",
      empresa: "001",
      regional: "01",
      sucursal: "001",
      haber_basico: 5000,
      cargo: "Contador Senior",
      centro_costo: "CC-001",
      tipo_contrato: "Indefinido",
      calificacion: "Profesional",
      fecha_inicio: "2020-01-15",
      fecha_termino: "",
      detalle_contrato: "Contrato indefinido con beneficios completos, incluye seguro médico y bono de antigüedad.",
      estado: "Alta"
    }
  ],
  complementarios: {
    referente_nombres: "María Pérez Vda. de García",
    referente_ci: "3456789 LP",
    referente_direccion: "Calle 21 de Calacoto #456",
    referente_telefono: "2-2445566",
    observaciones: "Empleado modelo con excelente desempeño. Certificación CPA vigente hasta 2025."
  },
  dependientes: {
    nombre_conyuge: "Ana María López de García",
    nombre_padre: "Roberto García Suárez",
    nombre_madre: "Carmen Morales de García",
    lista_dependientes: [
      {
        id: "1",
        nombre: "Ana María López de García",
        cedula_identidad: "6789012 LP",
        fecha_nacimiento: "1987-07-20",
        parentesco: "Cónyuge",
        sexo: "Femenino",
        nacionalidad: "Boliviana",
        beneficiario: true
      },
      {
        id: "2",
        nombre: "Carlos García López",
        cedula_identidad: "",
        fecha_nacimiento: "2010-05-10",
        parentesco: "Hijo/a",
        sexo: "Masculino",
        nacionalidad: "Boliviana",
        beneficiario: true
      },
      {
        id: "3",
        nombre: "Sofía García López",
        cedula_identidad: "",
        fecha_nacimiento: "2015-11-25",
        parentesco: "Hijo/a",
        sexo: "Femenino",
        nacionalidad: "Boliviana",
        beneficiario: true
      }
    ]
  }
}

// Catálogos mock
export const catalogosEmpleados = {
  sexos: ["Masculino", "Femenino", "Otro"] as Sexo[],
  estadosCiviles: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a"] as EstadoCivil[],
  afps: [
    "Futuro de Bolivia",
    "Previsión BBV",
    "Ninguna"
  ],
  activoJubilado: ["Activo", "Jubilado"],
  tiposContrato: ["Plazo Fijo", "Indefinido", "Eventual", "Consultoría"] as TipoContrato[],
  calificaciones: ["Profesional", "Técnico", "Administrativo", "Operativo"] as CalificacionContrato[],
  parentescos: ["Hijo/a", "Cónyuge", "Padre", "Madre", "Hermano/a", "Otro"] as Parentesco[],
  empresas: [
    { value: "001", label: "Empresa Principal" },
    { value: "002", label: "Sucursal Norte" }
  ],
  regionales: [
    { value: "01", label: "La Paz" },
    { value: "02", label: "Santa Cruz" },
    { value: "03", label: "Cochabamba" }
  ],
  sucursales: [
    { value: "001", label: "Oficina Central" },
    { value: "002", label: "Sucursal Zona Sur" }
  ],
  centrosCosto: [
    { value: "CC-001", label: "Administración" },
    { value: "CC-002", label: "Producción" },
    { value: "CC-003", label: "Ventas" }
  ],
  cargos: [
    "Contador Senior",
    "Asistente Contable",
    "Gerente",
    "Analista",
    "Secretaria"
  ]
}

