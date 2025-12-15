/**
 * Sistema de logs para transacciones y errores
 * 
 * Este archivo registra errores internos en la tabla transacciones_logs
 * sin afectar los procesos actuales del ERP.
 */

import { getSupabaseAdmin } from '@/lib/supabaseServer'

export interface TransactionLogEntry {
  tipo: 'error' | 'rollback' | 'warning' | 'info'
  modulo: string
  referencia: string
  descripcion: string
  detalles?: any
  usuario_id?: string
}

/**
 * Registrar un error de transacción
 * 
 * Esta función registra errores en la tabla transacciones_logs
 * sin afectar el flujo normal de la aplicación.
 * 
 * @param tipo Tipo de log
 * @param modulo Módulo donde ocurrió (ej: 'cotizaciones', 'alquileres')
 * @param referencia ID de referencia (ej: cotización ID, alquiler ID)
 * @param descripcion Descripción del error o evento
 * @param detalles Detalles adicionales (opcional)
 * @param usuarioId ID del usuario (opcional)
 */
export async function logTransactionError(
  tipo: TransactionLogEntry['tipo'],
  modulo: string,
  referencia: string,
  descripcion: string,
  detalles?: any,
  usuarioId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    
    const logEntry = {
      tipo,
      modulo,
      referencia,
      descripcion,
      detalles: detalles ? JSON.stringify(detalles) : null,
      usuario_id: usuarioId || null,
      fecha_creacion: new Date().toISOString()
    }

    const { error } = await supabase
      .from('transacciones_logs')
      .insert(logEntry)

    if (error) {
      // No lanzar error si falla el log, solo loguear en consola
      console.error('❌ [logTransactionError] Error registrando log:', error)
      console.error('   Log entry que falló:', logEntry)
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [logTransactionError] Log registrado: ${tipo} - ${modulo} - ${referencia}`)
      }
    }
  } catch (error) {
    // No lanzar error si falla el log, solo loguear en consola
    console.error('❌ [logTransactionError] Error inesperado registrando log:', error)
  }
}

/**
 * Registrar un error de rollback
 * 
 * Función de conveniencia para registrar rollbacks
 */
export async function logRollback(
  modulo: string,
  referencia: string,
  descripcion: string,
  error?: Error,
  usuarioId?: string
): Promise<void> {
  await logTransactionError(
    'rollback',
    modulo,
    referencia,
    descripcion,
    error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : undefined,
    usuarioId
  )
}

/**
 * Registrar una advertencia
 * 
 * Función de conveniencia para registrar advertencias
 */
export async function logWarning(
  modulo: string,
  referencia: string,
  descripcion: string,
  detalles?: any,
  usuarioId?: string
): Promise<void> {
  await logTransactionError('warning', modulo, referencia, descripcion, detalles, usuarioId)
}

/**
 * Registrar información
 * 
 * Función de conveniencia para registrar información
 */
export async function logInfo(
  modulo: string,
  referencia: string,
  descripcion: string,
  detalles?: any,
  usuarioId?: string
): Promise<void> {
  await logTransactionError('info', modulo, referencia, descripcion, detalles, usuarioId)
}








