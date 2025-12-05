import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { getPermisos, puedeEditar } from '@/lib/permisos'

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface LineaPayload {
  tipo: string
  codigo_producto?: string | null
  nombre_producto?: string | null
  descripcion?: string | null
  cantidad: number
  ancho?: number | null
  alto?: number | null
  total_m2?: number | null
  unidad_medida?: string
  precio_unitario: number
  comision_porcentaje?: number
  comision?: number
  con_iva: boolean
  con_it: boolean
  es_soporte?: boolean
  orden?: number
  imagen?: string | null
  variantes?: any
  subtotal_linea: number
}

export interface CotizacionPayload {
  codigo?: string
  cliente: string
  vendedor: string
  sucursal: string
  estado?: string
  vigencia_dias?: number
  plazo?: string | null
  lineas: LineaPayload[]
  total_final?: number | null
  regenerar_alquileres?: boolean
}

export interface UsuarioAutenticado {
  id: string
  email: string
  role?: string
  name?: string
}

// ============================================================================
// AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================================

/**
 * Obtiene el usuario autenticado desde la cookie de sesión
 * @param request Request de Next.js
 * @returns Usuario autenticado o null si no hay sesión válida
 */
export async function getUsuarioAutenticado(request: NextRequest): Promise<UsuarioAutenticado | null> {
  try {
    const token = request.cookies.get('session')?.value
    
    if (!token) {
      return null
    }

    const payload = await verifySession(token)
    
    if (!payload || !payload.sub) {
      return null
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      role: payload.role,
      name: payload.name
    }
  } catch (error) {
    console.error('❌ [getUsuarioAutenticado] Error verificando sesión:', error)
    return null
  }
}

/**
 * Verifica que el usuario tenga acceso a una cotización
 * Un usuario puede editar una cotización si:
 * - Es el vendedor de la cotización
 * - Tiene rol de admin
 * - Es el desarrollador (alen95ae@gmail.com)
 * - Tiene el permiso de "editar" en el módulo "ventas" (permite editar TODAS las cotizaciones)
 * 
 * @param cotizacionId ID de la cotización
 * @param usuario Usuario autenticado
 * @returns true si tiene acceso, false si no
 */
export async function verificarAccesoCotizacion(
  cotizacionId: string,
  usuario: UsuarioAutenticado
): Promise<boolean> {
  try {
    const supabase = getSupabaseServer()
    
    // Obtener la cotización
    const { data: cotizacion, error } = await supabase
      .from('cotizaciones')
      .select('vendedor')
      .eq('id', cotizacionId)
      .single()

    if (error || !cotizacion) {
      console.error('❌ [verificarAccesoCotizacion] Error obteniendo cotización:', error)
      return false
    }

    // El desarrollador siempre tiene acceso
    const isDeveloper = usuario.email?.toLowerCase() === 'alen95ae@gmail.com'
    if (isDeveloper) {
      return true
    }

    // Admin siempre tiene acceso
    if (usuario.role === 'admin') {
      return true
    }

    // Verificar si el usuario tiene permiso de "editar" en el módulo "ventas"
    // Esto permite editar TODAS las cotizaciones, no solo las propias
    try {
      const permisos = await getPermisos(usuario.id, usuario.email)
      if (puedeEditar(permisos, 'ventas')) {
        console.log('✅ [verificarAccesoCotizacion] Usuario tiene permiso de editar en ventas')
        return true
      }
    } catch (permisoError) {
      console.error('❌ [verificarAccesoCotizacion] Error verificando permisos:', permisoError)
      // Continuar con otras verificaciones si falla la verificación de permisos
    }

    // Verificar si el usuario es el vendedor
    // El vendedor puede ser un ID de usuario o un nombre
    // Primero intentamos comparar con el ID del usuario
    if (cotizacion.vendedor === usuario.id) {
      return true
    }

    // Si no coincide por ID, obtener el nombre del usuario y comparar
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', usuario.id)
      .single()

    if (usuarioData?.nombre && cotizacion.vendedor === usuarioData.nombre) {
      return true
    }

    return false
  } catch (error) {
    console.error('❌ [verificarAccesoCotizacion] Error:', error)
    return false
  }
}

/**
 * Verifica que un ID de cliente exista en la base de datos
 */
export async function verificarClienteExiste(clienteId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServer()
    
    // Verificar si es un ID UUID (cliente de Supabase)
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .single()

    if (!error && cliente) {
      return true
    }

    // Si no es UUID, podría ser un nombre (compatibilidad con código existente)
    // En ese caso, no validamos existencia estricta
    return true
  } catch (error) {
    console.error('❌ [verificarClienteExiste] Error:', error)
    return false
  }
}

/**
 * Verifica que un ID de vendedor exista en la base de datos
 */
export async function verificarVendedorExiste(vendedorId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServer()
    
    // Verificar si es un ID UUID (usuario)
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', vendedorId)
      .single()

    if (!error && usuario) {
      return true
    }

    // Si no es UUID, podría ser un nombre (compatibilidad con código existente)
    // En ese caso, no validamos existencia estricta
    return true
  } catch (error) {
    console.error('❌ [verificarVendedorExiste] Error:', error)
    return false
  }
}

/**
 * Verifica que un código de soporte exista en la base de datos
 */
export async function verificarSoporteExiste(codigoSoporte: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServer()
    
    const { data: soporte, error } = await supabase
      .from('soportes')
      .select('id')
      .eq('codigo', codigoSoporte)
      .single()

    return !error && !!soporte
  } catch (error) {
    console.error('❌ [verificarSoporteExiste] Error:', error)
    return false
  }
}

// ============================================================================
// VALIDACIÓN Y NORMALIZACIÓN DE LÍNEAS
// ============================================================================

/**
 * Valida y normaliza una línea de cotización
 * @param linea Línea a validar
 * @param index Índice de la línea (para mensajes de error)
 * @returns Línea normalizada o null si es inválida
 */
export function validarYNormalizarLinea(linea: any, index: number): LineaPayload | null {
  // Validar tipo
  if (!linea.tipo || (linea.tipo !== 'Producto' && linea.tipo !== 'producto' && linea.tipo !== 'Nota' && linea.tipo !== 'nota' && linea.tipo !== 'Sección' && linea.tipo !== 'seccion')) {
    console.error(`❌ [validarYNormalizarLinea] Línea ${index}: tipo inválido: ${linea.tipo}`)
    return null
  }

  // Si es Nota o Sección, validaciones mínimas
  if (linea.tipo === 'Nota' || linea.tipo === 'nota' || linea.tipo === 'Sección' || linea.tipo === 'seccion') {
    return {
      tipo: linea.tipo.charAt(0).toUpperCase() + linea.tipo.slice(1).toLowerCase(),
      codigo_producto: null,
      nombre_producto: linea.tipo === 'Sección' || linea.tipo === 'seccion' ? (linea.nombre_producto || linea.texto || '') : null,
      descripcion: linea.tipo === 'Nota' || linea.tipo === 'nota' ? (linea.descripcion || linea.texto || '') : null,
      cantidad: 0,
      ancho: null,
      alto: null,
      total_m2: null,
      unidad_medida: '',
      precio_unitario: 0,
      comision_porcentaje: 0,
      con_iva: false,
      con_it: false,
      es_soporte: false,
      orden: linea.orden || index + 1,
      imagen: null,
      variantes: null,
      subtotal_linea: 0
    }
  }

  // Validaciones para Producto
  const cantidad = parseFloat(linea.cantidad) || 0
  if (cantidad < 0) {
    console.error(`❌ [validarYNormalizarLinea] Línea ${index}: cantidad negativa: ${cantidad}`)
    return null
  }

  const precioUnitario = parseFloat(linea.precio_unitario) || 0
  if (precioUnitario < 0) {
    console.error(`❌ [validarYNormalizarLinea] Línea ${index}: precio_unitario negativo: ${precioUnitario}`)
    return null
  }

  const subtotalLinea = parseFloat(linea.subtotal_linea) || 0
  if (subtotalLinea < 0) {
    console.error(`❌ [validarYNormalizarLinea] Línea ${index}: subtotal_linea negativo: ${subtotalLinea}`)
    return null
  }

  // Normalizar variantes
  // ERROR #9: Validar variantes en validarYNormalizarLinea para evitar tipos incorrectos
  let variantesParsed = null
  if (linea.variantes !== null && linea.variantes !== undefined) {
    try {
      if (typeof linea.variantes === 'string') {
        const parsed = JSON.parse(linea.variantes)
        // Validar que sea un objeto (no array, no primitivo)
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
          variantesParsed = parsed
        } else {
          console.warn(`⚠️ [validarYNormalizarLinea] Línea ${index}: variantes parseado no es un objeto válido, ignorando`)
          variantesParsed = null
        }
      } else if (typeof linea.variantes === 'object' && !Array.isArray(linea.variantes)) {
        // Solo aceptar objetos planos, no arrays ni null
        if (linea.variantes !== null) {
          variantesParsed = linea.variantes
        } else {
          variantesParsed = null
        }
      } else {
        // Si es array u otro tipo, ignorar
        console.warn(`⚠️ [validarYNormalizarLinea] Línea ${index}: variantes tiene tipo inválido (${typeof linea.variantes}), ignorando`)
        variantesParsed = null
      }
    } catch (parseError) {
      console.warn(`⚠️ [validarYNormalizarLinea] Línea ${index}: Error parseando variantes:`, parseError)
      variantesParsed = null
    }
  }

  // Validar que no se guarden URLs blob
  const imagenValida = linea.imagen && !linea.imagen.startsWith('blob:') ? linea.imagen : null

  return {
    tipo: 'Producto',
    codigo_producto: linea.codigo_producto || null,
    nombre_producto: linea.nombre_producto || null,
    descripcion: linea.descripcion || null,
    cantidad,
    ancho: linea.ancho ? parseFloat(linea.ancho) : null,
    alto: linea.alto ? parseFloat(linea.alto) : null,
    total_m2: linea.total_m2 ? parseFloat(linea.total_m2) : null,
    unidad_medida: linea.unidad_medida || 'm²',
    precio_unitario: precioUnitario,
    comision_porcentaje: linea.comision_porcentaje || linea.comision || 0,
    con_iva: linea.con_iva !== undefined ? linea.con_iva : true,
    con_it: linea.con_it !== undefined ? linea.con_it : true,
    es_soporte: linea.es_soporte || false,
    orden: linea.orden || index + 1,
    imagen: imagenValida,
    variantes: variantesParsed,
    subtotal_linea: subtotalLinea
  }
}

/**
 * Valida y normaliza todas las líneas de una cotización
 */
export function validarYNormalizarLineas(lineas: any[]): LineaPayload[] {
  const lineasValidas: LineaPayload[] = []

  for (let i = 0; i < lineas.length; i++) {
    const lineaNormalizada = validarYNormalizarLinea(lineas[i], i)
    if (lineaNormalizada) {
      lineasValidas.push(lineaNormalizada)
    } else {
      console.error(`❌ [validarYNormalizarLineas] Línea ${i} descartada por validación fallida`)
    }
  }

  return lineasValidas
}

// ============================================================================
// VALIDACIÓN DE TOTALES
// ============================================================================

/**
 * Valida que el total_final sea consistente con la suma de subtotal_linea
 * Permite una tolerancia mínima para errores de redondeo
 * @param totalFinal Total final enviado
 * @param lineas Líneas de la cotización
 * @param tolerancia Tolerancia permitida (default: 0.01)
 * @returns true si es válido, false si no
 */
export function validarTotalFinal(
  totalFinal: number | null | undefined,
  lineas: LineaPayload[],
  tolerancia: number = 0.01
): boolean {
  // Si no hay total_final, no validamos (el backend lo calculará)
  if (totalFinal === null || totalFinal === undefined) {
    return true
  }

  // Calcular suma de subtotal_linea de productos
  const sumaSubtotales = lineas
    .filter(l => l.tipo === 'Producto')
    .reduce((sum, l) => sum + (l.subtotal_linea || 0), 0)

  // Calcular diferencia
  const diferencia = Math.abs(totalFinal - sumaSubtotales)

  // Validar que la diferencia esté dentro de la tolerancia
  if (diferencia > tolerancia) {
    console.error(`❌ [validarTotalFinal] Diferencia excesiva: total_final=${totalFinal}, suma_subtotales=${sumaSubtotales}, diferencia=${diferencia}`)
    return false
  }

  return true
}

/**
 * Calcula el total_final a partir de las líneas
 * Usa la misma lógica que el backend actual
 * Redondea a 2 decimales para evitar números con muchos decimales
 */
export function calcularTotalFinalDesdeLineas(lineas: LineaPayload[]): number {
  const total = lineas
    .filter(l => l.tipo === 'Producto')
    .reduce((sum, l) => sum + (l.subtotal_linea || 0), 0)
  
  // Redondear a 2 decimales
  return Math.round(total * 100) / 100
}

/**
 * Calcula subtotal, total_iva y total_it para el desglose
 * Usa la misma lógica que el backend actual
 */
export function calcularDesgloseImpuestos(lineas: LineaPayload[]): {
  subtotal: number
  totalIVA: number
  totalIT: number
} {
  let subtotal = 0
  let totalIVA = 0
  let totalIT = 0

  lineas.forEach((linea) => {
    if (linea.tipo === 'Producto') {
      const lineaTotal = linea.subtotal_linea || 0
      subtotal += lineaTotal

      // Calcular IVA e IT para el desglose (solo informativo)
      if (linea.con_iva && linea.con_it) {
        const base = lineaTotal / 1.16
        totalIVA += base * 0.13
        totalIT += base * 0.03
      } else if (linea.con_iva) {
        const base = lineaTotal / 1.13
        totalIVA += base * 0.13
      } else if (linea.con_it) {
        const base = lineaTotal / 1.03
        totalIT += base * 0.03
      }
    }
  })

  return { subtotal, totalIVA, totalIT }
}

