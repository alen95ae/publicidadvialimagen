import { getSupabaseServer } from "@/lib/supabaseServer";

// Tipo base igual a la tabla real de Supabase
export type Cotizacion = {
  id: string;
  codigo: string;
  cliente: string | null;
  vendedor: string | null;
  sucursal: string | null;
  estado: string | null;
  subtotal: number | null;
  total_iva: number | null;
  total_it: number | null;
  total_final: number | null;
  vigencia: number | null;
  cantidad_items: number | null;
  lineas_cotizacion: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

// Interfaz para crear/actualizar cotización
export interface CotizacionInput {
  codigo?: string;
  cliente?: string;
  vendedor?: string;
  sucursal?: string;
  estado?: string;
  subtotal?: number;
  total_iva?: number;
  total_it?: number;
  total_final?: number;
  vigencia?: number;
  cantidad_items?: number;
  lineas_cotizacion?: number;
}

// Obtener todas las cotizaciones con filtros opcionales
export async function getCotizaciones(options?: {
  estado?: string;
  cliente?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = getSupabaseServer();

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getCotizaciones] Iniciando consulta con opciones:', options)
    console.log('🔍 [getCotizaciones] Verificando Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  let query = supabase
    .from("cotizaciones")
    .select("*", { count: "exact" })
    .order("fecha_creacion", { ascending: false });

  // Aplicar filtros
  if (options?.estado) {
    query = query.eq("estado", options.estado);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getCotizaciones] Filtro estado aplicado:', options.estado)
    }
  }
  if (options?.cliente) {
    query = query.ilike("cliente", `%${options.cliente}%`);
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getCotizaciones] Filtro cliente aplicado:', options.cliente)
    }
  }

  // Paginación
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getCotizaciones] Paginación:', { page, limit, from, to })
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getCotizaciones] Error en consulta:', error)
    console.error('❌ [getCotizaciones] Error details:', JSON.stringify(error, null, 2))
    console.error('❌ [getCotizaciones] Error code:', (error as any).code)
    console.error('❌ [getCotizaciones] Error message:', (error as any).message)
    console.error('❌ [getCotizaciones] Error hint:', (error as any).hint)
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [getCotizaciones] Consulta exitosa:', { 
      dataLength: data?.length || 0, 
      count: count || 0 
    })
  }

  // Calcular y actualizar estados vencidos
  const ahora = new Date()
  const cotizacionesActualizadas = await Promise.all(
    (data || []).map(async (cotizacion) => {
      // Solo verificar vencimiento si no está Aprobada o Rechazada
      if (cotizacion.estado !== 'Aprobada' && cotizacion.estado !== 'Rechazada' && cotizacion.fecha_creacion) {
        const fechaCreacion = new Date(cotizacion.fecha_creacion)
        const vigenciaDias = cotizacion.vigencia || 30
        const fechaVencimiento = new Date(fechaCreacion)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias)
        
        if (ahora > fechaVencimiento && cotizacion.estado !== 'Vencida') {
          // Actualizar estado a Vencida en la base de datos
          try {
            await updateCotizacion(cotizacion.id, { estado: 'Vencida' })
            return { ...cotizacion, estado: 'Vencida' }
          } catch (error) {
            console.warn(`⚠️ [getCotizaciones] Error actualizando estado vencido para ${cotizacion.id}:`, error)
            return cotizacion
          }
        }
      }
      return cotizacion
    })
  )

  return {
    data: cotizacionesActualizadas as Cotizacion[],
    count: count || 0,
  };
}

// Obtener una cotización por ID
export async function getCotizacionById(id: string) {
  const supabase = getSupabaseServer();

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getCotizacionById] Buscando cotización con ID:', id)
  }

  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error('❌ [getCotizacionById] Error:', error)
    console.error('❌ [getCotizacionById] Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [getCotizacionById] Cotización encontrada:', data?.codigo)
  }

  // Calcular y actualizar estado vencido si corresponde
  if (data && data.estado !== 'Aprobada' && data.estado !== 'Rechazada' && data.fecha_creacion) {
    const fechaCreacion = new Date(data.fecha_creacion)
    const vigenciaDias = data.vigencia || 30
    const fechaVencimiento = new Date(fechaCreacion)
    fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias)
    const ahora = new Date()
    
    if (ahora > fechaVencimiento && data.estado !== 'Vencida') {
      // Actualizar estado a Vencida en la base de datos
      try {
        const actualizada = await updateCotizacion(data.id, { estado: 'Vencida' })
        return actualizada
      } catch (error) {
        console.warn(`⚠️ [getCotizacionById] Error actualizando estado vencido:`, error)
        return data as Cotizacion
      }
    }
  }

  return data as Cotizacion;
}

// Crear una nueva cotización
export async function createCotizacion(cotizacion: CotizacionInput) {
  const supabase = getSupabaseServer();

  const insertData = {
      codigo: cotizacion.codigo || "",
      cliente: cotizacion.cliente || null,
      vendedor: cotizacion.vendedor || null,
      sucursal: cotizacion.sucursal || null,
      estado: cotizacion.estado || "Pendiente",
      subtotal: cotizacion.subtotal || 0,
      total_iva: cotizacion.total_iva || 0,
      total_it: cotizacion.total_it || 0,
      total_final: cotizacion.total_final || 0,
      vigencia: cotizacion.vigencia || 30,
      cantidad_items: cotizacion.cantidad_items || 0,
      lineas_cotizacion: cotizacion.lineas_cotizacion || 0,
    }

  if (process.env.NODE_ENV === 'development') {
    console.log('📝 [createCotizacion] Insertando cotización:', JSON.stringify(insertData, null, 2))
    console.log('📝 [createCotizacion] Verificando Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  const { data, error } = await supabase
    .from("cotizaciones")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ [createCotizacion] Error en inserción:', error)
    console.error('❌ [createCotizacion] Error details:', JSON.stringify(error, null, 2))
    console.error('❌ [createCotizacion] Error code:', (error as any).code)
    console.error('❌ [createCotizacion] Error message:', (error as any).message)
    console.error('❌ [createCotizacion] Error hint:', (error as any).hint)
    console.error('❌ [createCotizacion] Insert data:', JSON.stringify(insertData, null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [createCotizacion] Cotización creada exitosamente:', data?.id, data?.codigo)
  }

  return data as Cotizacion;
}

// Actualizar una cotización
export async function updateCotizacion(
  id: string,
  cotizacion: Partial<CotizacionInput>
) {
  const supabase = getSupabaseServer();

  const updateData: any = {};
  if (cotizacion.codigo !== undefined) updateData.codigo = cotizacion.codigo;
  if (cotizacion.cliente !== undefined) updateData.cliente = cotizacion.cliente;
  if (cotizacion.vendedor !== undefined) updateData.vendedor = cotizacion.vendedor;
  if (cotizacion.sucursal !== undefined) updateData.sucursal = cotizacion.sucursal;
  if (cotizacion.estado !== undefined) updateData.estado = cotizacion.estado;
  if (cotizacion.subtotal !== undefined) updateData.subtotal = cotizacion.subtotal;
  if (cotizacion.total_iva !== undefined) updateData.total_iva = cotizacion.total_iva;
  if (cotizacion.total_it !== undefined) updateData.total_it = cotizacion.total_it;
  if (cotizacion.total_final !== undefined) updateData.total_final = cotizacion.total_final;
  if (cotizacion.vigencia !== undefined) updateData.vigencia = cotizacion.vigencia;
  if (cotizacion.cantidad_items !== undefined) updateData.cantidad_items = cotizacion.cantidad_items;
  if (cotizacion.lineas_cotizacion !== undefined) updateData.lineas_cotizacion = cotizacion.lineas_cotizacion;

  // Actualizar fecha_actualizacion automáticamente
  updateData.fecha_actualizacion = new Date().toISOString();

  if (process.env.NODE_ENV === 'development') {
    console.log('📝 [updateCotizacion] Actualizando cotización:', id)
    console.log('📝 [updateCotizacion] Datos a actualizar:', JSON.stringify(updateData, null, 2))
  }

  const { data, error } = await supabase
    .from("cotizaciones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error('❌ [updateCotizacion] Error:', error)
    console.error('❌ [updateCotizacion] Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [updateCotizacion] Cotización actualizada exitosamente:', data?.codigo)
  }

  return data as Cotizacion;
}

// Eliminar una cotización
export async function deleteCotizacion(id: string) {
  const supabase = getSupabaseServer();

  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ [deleteCotizacion] Eliminando cotización:', id)
  }

  const { error } = await supabase
    .from("cotizaciones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error('❌ [deleteCotizacion] Error:', error)
    console.error('❌ [deleteCotizacion] Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [deleteCotizacion] Cotización eliminada exitosamente')
  }

  return { success: true };
}

// Generar siguiente código de cotización en formato COT-MM-AA-00000
export async function generarSiguienteCodigoCotizacion(): Promise<string> {
  try {
    // Obtener mes y año actual
    const ahora = new Date();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0'); // 01-12
    const año = ahora.getFullYear().toString().slice(-2); // Últimos 2 dígitos del año
    
    // Obtener todas las cotizaciones
    const result = await getCotizaciones({ limit: 10000 });
    const cotizaciones = result.data;

    // Filtrar cotizaciones con el formato COT-MM-AA-XXXXX del mes/año actual
    const patronActual = new RegExp(`^COT-${mes}-${año}-(\\d+)$`);
    const numeros = cotizaciones
      .map((c) => {
        if (!c.codigo) return null;
        const match = c.codigo.match(patronActual);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n) => n !== null && !isNaN(n!)) as number[];

    // Número inicial mínimo: 1500
    const numeroInicial = 1500;
    
    // Si no hay cotizaciones del mes/año actual, empezar desde 1500
    // Si hay cotizaciones, usar el máximo entre el número máximo encontrado + 1 y 1500
    const siguiente = numeros.length > 0 
      ? Math.max(Math.max(...numeros) + 1, numeroInicial)
      : numeroInicial;

    // Formatear con 5 dígitos
    const numeroFormateado = siguiente.toString().padStart(5, '0');

    return `COT-${mes}-${año}-${numeroFormateado}`;
  } catch (error) {
    console.error("Error generando código de cotización:", error);
    // Fallback: retornar código con formato nuevo pero número 01500
    const ahora = new Date();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const año = ahora.getFullYear().toString().slice(-2);
    return `COT-${mes}-${año}-01500`;
  }
}

