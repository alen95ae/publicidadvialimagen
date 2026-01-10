/**
 * Servicio para gestión del historial de stock
 * Registra todos los movimientos de stock de forma inmutable
 */

import { getSupabaseServer } from './supabaseServer'

const supabase = getSupabaseServer()

export interface HistorialStockEntry {
  fecha?: string
  origen: 'registro_manual' | 'cotizacion_aprobada' | 'cotizacion_rechazada' | 'cotizacion_editada' | 'cotizacion_eliminada'
  referencia_id?: string | null
  referencia_codigo?: string | null
  item_tipo: 'Recurso' | 'Consumible'
  item_id: string
  item_codigo: string
  item_nombre: string
  sucursal: string
  formato?: any | null
  cantidad_udm: number
  unidad_medida: string
  impacto: number // Numérico: positivo para suma, negativo para resta
  stock_anterior: number
  stock_nuevo: number
  tipo_movimiento: string // NOT NULL - siempre debe tener valor
  observaciones?: string | null
  usuario_id?: string | null
  usuario_nombre?: string | null
}

/**
 * Inserta un registro en el historial de stock
 */
export async function insertarHistorialStock(entry: HistorialStockEntry): Promise<void> {
  // #region agent log
  const attemptId = `HISTORIAL_ATTEMPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:35',message:'insertarHistorialStock ENTRY',data:{attemptId,entry},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Verificar cliente Supabase
  // #region agent log
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:40',message:'Cliente Supabase check',data:{attemptId,hasServiceKey,serviceKeyLength,hasSupabaseUrl:!!supabaseUrl,supabaseType:'getSupabaseServer'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Normalizar payload antes del insert
  const payload = {
    fecha: entry.fecha || new Date().toISOString(),
    origen: entry.origen,
    referencia_id: entry.referencia_id || null,
    referencia_codigo: entry.referencia_codigo || null,
    item_tipo: entry.item_tipo,
    item_id: entry.item_id,
    item_codigo: entry.item_codigo || '',
    item_nombre: entry.item_nombre || '',
    sucursal: entry.sucursal || '',
    formato: entry.formato || null,
    cantidad_udm: Number(entry.cantidad_udm) || 0,
    unidad_medida: entry.unidad_medida || '',
    impacto: Number(entry.impacto) || 0, // Asegurar que sea número
    stock_anterior: Number(entry.stock_anterior) || 0,
    stock_nuevo: Number(entry.stock_nuevo) || 0,
    tipo_movimiento: entry.tipo_movimiento || 'Movimiento inventario', // NOT NULL - valor por defecto
    observaciones: entry.observaciones || null,
    usuario_id: entry.usuario_id || null,
    usuario_nombre: entry.usuario_nombre || null
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:60',message:'Payload normalizado',data:{attemptId,payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Validar campos críticos
  if (!payload.item_id || !payload.item_codigo || !payload.item_nombre) {
    const error = new Error(`Campos requeridos faltantes en historial: item_id=${payload.item_id}, item_codigo=${payload.item_codigo}, item_nombre=${payload.item_nombre}`)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:65',message:'VALIDATION ERROR campos faltantes',data:{attemptId,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('❌ Error validando payload historial:', error)
    throw error
  }

  if (!payload.tipo_movimiento || payload.tipo_movimiento.trim() === '') {
    const error = new Error('tipo_movimiento es requerido y no puede estar vacío')
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:70',message:'VALIDATION ERROR tipo_movimiento vacío',data:{attemptId,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    console.error('❌ Error validando payload historial:', error)
    throw error
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:72',message:'ANTES de insert',data:{attemptId,table:'historial_stock',payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const { data, error } = await supabase
    .from('historial_stock')
    .insert([payload])
    .select()

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:78',message:'DESPUÉS de insert',data:{attemptId,hasData:!!data,dataLength:data?.length||0,hasError:!!error,errorMessage:error?.message,errorCode:error?.code,errorDetails:error?.details,errorHint:error?.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:80',message:'ERROR en insert',data:{attemptId,error:JSON.stringify(error),payload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.error('❌ Error insertando en historial_stock:', error)
    console.error('❌ Payload que falló:', JSON.stringify(payload, null, 2))
    throw new Error(`Error insertando en historial_stock: ${error.message}`)
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0c38a0dd-0488-46f2-9e99-19064c1193dd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseHistorialStock.ts:87',message:'insertarHistorialStock SUCCESS',data:{attemptId,insertedData:data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  console.log(`✅ [HISTORIAL] Registro insertado: ${entry.item_tipo} ${entry.item_codigo} - impacto: ${payload.impacto}, cantidad: ${payload.cantidad_udm} ${payload.unidad_medida}`)
}

/**
 * Obtiene el usuario actual desde la sesión
 * Si falla, retorna null/null sin lanzar error (para no bloquear historial)
 * 
 * @param request NextRequest opcional para obtener usuario desde cookies
 */
export async function obtenerUsuarioActual(request?: any): Promise<{ id: string | null, nombre: string | null }> {
  try {
    // Si se proporciona request, intentar obtener usuario desde cookies
    if (request && request.cookies) {
      try {
        const { getUsuarioAutenticado } = await import('@/lib/cotizacionesBackend')
        const usuario = await getUsuarioAutenticado(request)
        if (usuario) {
          // Obtener nombre desde tabla usuarios
          const { getSupabaseServer } = await import('@/lib/supabaseServer')
          const supabase = getSupabaseServer()
          const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('id', usuario.id)
            .single()
          
          return {
            id: usuario.id,
            nombre: usuarioData?.nombre || usuario.name || usuario.email || null
          }
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener usuario desde request:', error)
      }
    }
    
    // Si no hay request o falla, retornar null/null
    // El historial se registrará sin usuario_id (campo nullable)
    return { id: null, nombre: null }
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual:', error)
    return { id: null, nombre: null }
  }
}
