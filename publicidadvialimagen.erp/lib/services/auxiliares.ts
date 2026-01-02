/**
 * Servicio centralizado para gestión de auxiliares contables
 * Maneja la creación y validación de auxiliares
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Auxiliar } from '@/lib/types/contabilidad'

export interface EnsureAuxiliarParams {
  empresa_id: number
  cuenta_id: number
  contact_id?: string | null
  tipo_auxiliar: string
  codigo?: string
  nombre: string
  moneda?: string
}

/**
 * Asegura que existe un auxiliar con los parámetros dados.
 * Si existe, lo retorna. Si no existe, lo crea.
 * 
 * @param supabase Cliente de Supabase (debe tener permisos de escritura)
 * @param params Parámetros del auxiliar
 * @returns Auxiliar existente o creado
 */
export async function ensureAuxiliar(
  supabase: SupabaseClient,
  params: EnsureAuxiliarParams
): Promise<Auxiliar> {
  const {
    empresa_id,
    cuenta_id,
    contact_id,
    tipo_auxiliar,
    codigo,
    nombre,
    moneda = 'BOB'
  } = params

  // Validaciones básicas
  if (!tipo_auxiliar || !nombre) {
    throw new Error('tipo_auxiliar y nombre son requeridos')
  }

  // Si se proporciona código, buscar por código y tipo
  if (codigo) {
    const { data: existente, error: errorBuscar } = await supabase
      .from('auxiliares')
      .select('*')
      .eq('tipo_auxiliar', tipo_auxiliar)
      .eq('codigo', codigo)
      .maybeSingle()

    if (errorBuscar) {
      console.error('Error buscando auxiliar existente:', errorBuscar)
      throw new Error(`Error al buscar auxiliar: ${errorBuscar.message}`)
    }

    if (existente) {
      return existente as Auxiliar
    }
  }

  // Si no existe, crear nuevo auxiliar
  // Obtener cuenta_asociada desde cuenta_id
  const { data: cuenta, error: errorCuenta } = await supabase
    .from('plan_cuentas')
    .select('cuenta')
    .eq('id', cuenta_id)
    .eq('empresa_id', empresa_id)
    .single()

  if (errorCuenta || !cuenta) {
    console.error('Error obteniendo cuenta:', errorCuenta)
    throw new Error(`Cuenta no encontrada: ${cuenta_id}`)
  }

  // Generar código si no se proporciona
  const codigoFinal = codigo || generarCodigoAuxiliar(tipo_auxiliar, nombre)

  // Preparar datos para inserción
  const auxiliarData: any = {
    tipo_auxiliar,
    codigo: codigoFinal,
    nombre,
    cuenta_asociada: cuenta.cuenta,
    moneda,
    cuenta_bancaria_o_caja: false,
    vigencia: true,
  }

  // Insertar en tabla base (no VIEW)
  const { data: nuevoAuxiliar, error: errorInsertar } = await supabase
    .from('auxiliares')
    .insert(auxiliarData)
    .select()
    .single()

  if (errorInsertar) {
    console.error('Error creando auxiliar:', errorInsertar)
    throw new Error(`Error al crear el auxiliar: ${errorInsertar.message}`)
  }

  if (!nuevoAuxiliar) {
    throw new Error('No se pudo crear el auxiliar')
  }

  return nuevoAuxiliar as Auxiliar
}

/**
 * Genera un código único para un auxiliar basado en tipo y nombre
 */
function generarCodigoAuxiliar(tipo: string, nombre: string): string {
  // Tomar primeras 3 letras del tipo en mayúsculas
  const prefijo = tipo.substring(0, 3).toUpperCase()
  
  // Tomar primeras 3 letras del nombre sin espacios
  const nombreLimpio = nombre.replace(/\s+/g, '').substring(0, 3).toUpperCase()
  
  // Generar número aleatorio de 3 dígitos
  const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `${prefijo}${nombreLimpio}${numero}`
}

/**
 * Crea un auxiliar desde datos parciales (compatibilidad con endpoint actual)
 * 
 * @param supabase Cliente de Supabase
 * @param datos Datos parciales del auxiliar
 * @returns Auxiliar creado
 */
export async function crearAuxiliar(
  supabase: SupabaseClient,
  datos: Partial<Auxiliar>
): Promise<Auxiliar> {
  // Validaciones básicas
  if (!datos.tipo_auxiliar || !datos.codigo || !datos.nombre) {
    throw new Error('Tipo auxiliar, código y nombre son requeridos')
  }

  // Preparar datos para inserción
  const auxiliarData: Partial<Auxiliar> = {
    tipo_auxiliar: datos.tipo_auxiliar,
    codigo: datos.codigo,
    nombre: datos.nombre,
    cuenta_asociada: datos.cuenta_asociada || null,
    moneda: datos.moneda || 'BOB',
    cuenta_bancaria_o_caja: datos.cuenta_bancaria_o_caja || false,
    departamento: datos.departamento || null,
    direccion: datos.direccion || null,
    telefono: datos.telefono || null,
    email: datos.email || null,
    nit: datos.nit || null,
    autorizacion: datos.autorizacion || null,
    vigencia: datos.vigencia !== undefined ? datos.vigencia : true,
  }

  // Insertar en tabla base (no VIEW)
  const { data, error } = await supabase
    .from('auxiliares')
    .insert(auxiliarData)
    .select()
    .single()

  if (error) {
    console.error('Error creando auxiliar:', error)
    throw new Error(`Error al crear el auxiliar: ${error.message}`)
  }

  if (!data) {
    throw new Error('No se pudo crear el auxiliar')
  }

  return data as Auxiliar
}

