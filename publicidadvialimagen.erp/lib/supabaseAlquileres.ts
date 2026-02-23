import { getSupabaseServer } from "@/lib/supabaseServer";

// Tipo base igual a la tabla real de Supabase
export type Alquiler = {
  id: string;
  codigo: string;
  cotizacion_id: string;
  cliente: string | null;
  vendedor: string | null;
  soporte_id: string | number; // Puede ser UUID (string) o numérico según el esquema
  inicio: string; // date
  fin: string; // date
  meses: number | null;
  total: number | null;
  estado: string | null; // 'activo', 'reservado', 'proximo', 'finalizado'
  fecha_creacion: string;
  fecha_actualizacion: string;
};

// Interfaz para crear/actualizar alquiler
export interface AlquilerInput {
  codigo?: string;
  cotizacion_id: string;
  cliente?: string;
  vendedor?: string;
  soporte_id: string | number; // Puede ser UUID (string) o numérico según el esquema
  inicio: string;
  fin: string;
  meses?: number;
  total?: number;
  estado?: string;
}

// Función para calcular el estado de un alquiler según las fechas
export function recalcularEstadoAlquiler(alquiler: Alquiler): 'activo' | 'reservado' | 'proximo' | 'finalizado' {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const inicio = new Date(alquiler.inicio);
  inicio.setHours(0, 0, 0, 0);
  
  const fin = new Date(alquiler.fin);
  fin.setHours(0, 0, 0, 0);
  
  // Calcular fecha de "próximo" (5 días antes del fin)
  const finMenos5Dias = new Date(fin);
  finMenos5Dias.setDate(finMenos5Dias.getDate() - 5);
  finMenos5Dias.setHours(0, 0, 0, 0);
  
  // Finalizado: fin < hoy
  if (fin < hoy) {
    return 'finalizado';
  }
  
  // Reservado: inicio > hoy
  if (inicio > hoy) {
    return 'reservado';
  }
  
  // Próximo: hoy está entre (fin - 5 días) y fin, y el alquiler está activo
  if (hoy >= finMenos5Dias && hoy <= fin) {
    return 'proximo';
  }
  
  // Activo: hoy está entre inicio y fin
  if (hoy >= inicio && hoy <= fin) {
    return 'activo';
  }
  
  // Por defecto, si no cumple ninguna condición, considerar finalizado
  return 'finalizado';
}

// Obtener todos los alquileres con filtros opcionales
export async function getAlquileres(options?: {
  estado?: string;
  cliente?: string;
  vendedor?: string;
  search?: string; // Búsqueda general en múltiples campos
  soporte_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = getSupabaseServer();

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getAlquileres] Iniciando consulta con opciones:', options);
  }

  let query = supabase
    .from("alquileres")
    .select("*", { count: "exact" })
    .order("fecha_creacion", { ascending: false });

  // Aplicar filtros
  if (options?.estado) {
    query = query.eq("estado", options.estado);
  }
  if (options?.cliente) {
    query = query.ilike("cliente", `%${options.cliente}%`);
  }
  if (options?.vendedor) {
    // Normalizar el vendedor (trim) para evitar problemas con espacios al final
    const vendedorNormalizado = options.vendedor.trim();
    // Usar ilike para búsqueda case-insensitive, pero también normalizar en la consulta
    // Buscar tanto con espacios como sin espacios al final
    query = query.or(`vendedor.ilike.%${vendedorNormalizado}%,vendedor.ilike.%${vendedorNormalizado} %`);
  }
  // Búsqueda general en múltiples campos
  if (options?.search) {
    query = query.or(`cliente.ilike.%${options.search}%,vendedor.ilike.%${options.search}%,codigo.ilike.%${options.search}%`);
  }
  if (options?.soporte_id) {
    query = query.eq("soporte_id", options.soporte_id);
  }
  // Filtro de fechas: mostrar alquileres que se solapan con el rango
  // Un alquiler se solapa si: inicio <= fecha_fin AND fin >= fecha_inicio
  if (options?.fecha_inicio && options?.fecha_fin) {
    // Mostrar alquileres que empiezan antes o en el fin del rango Y terminan después o en el inicio del rango
    query = query.lte("inicio", options.fecha_fin).gte("fin", options.fecha_inicio);
  } else if (options?.fecha_inicio) {
    query = query.gte("fin", options.fecha_inicio);
  } else if (options?.fecha_fin) {
    query = query.lte("inicio", options.fecha_fin);
  }

  // Paginación
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [getAlquileres] Error en consulta:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [getAlquileres] Consulta exitosa:', {
      dataLength: data?.length || 0,
      count: count || 0
    });
  }

  // Si hay búsqueda, también buscar por código de soporte
  let soporteIdsParaBuscar: (string | number)[] = [];
  if (options?.search) {
    try {
      // Buscar soportes que coincidan con el término de búsqueda
      const { data: soportesBusqueda, error: errorBusqueda } = await supabase
        .from("soportes")
        .select("id")
        .ilike("codigo", `%${options.search}%`);
      
      if (!errorBusqueda && soportesBusqueda) {
        soporteIdsParaBuscar = soportesBusqueda.map((s: any) => s.id);
      }
    } catch (error) {
      console.warn('⚠️ [getAlquileres] Error buscando soportes:', error);
    }
  }

  // Obtener códigos, títulos y ciudades de soportes
  const soporteIds = [...new Set([
    ...(data || []).map((a: any) => a.soporte_id).filter(Boolean),
    ...soporteIdsParaBuscar
  ])];
  const codigosSoportes: Record<string | number, string> = {};
  const titulosSoportes: Record<string | number, string> = {};
  const ciudadesSoportes: Record<string | number, string> = {};
  
  if (soporteIds.length > 0) {
    try {
      const { data: soportesData, error: soportesError } = await supabase
        .from("soportes")
        .select("id, codigo, titulo, ciudad")
        .in("id", soporteIds);
      
      if (!soportesError && soportesData) {
        soportesData.forEach((soporte: any) => {
          codigosSoportes[soporte.id] = soporte.codigo;
          titulosSoportes[soporte.id] = soporte.titulo || '';
          ciudadesSoportes[soporte.id] = soporte.ciudad || '';
        });
      }
    } catch (error) {
      console.warn('⚠️ [getAlquileres] Error obteniendo códigos de soportes:', error);
    }
  }

  // Si hay búsqueda y encontramos soportes, agregar esos alquileres a los resultados
  let dataConSoportes = data || [];
  if (options?.search && soporteIdsParaBuscar.length > 0) {
    try {
      const { data: alquileresPorSoporte, error: errorAlquileres } = await supabase
        .from("alquileres")
        .select("*")
        .in("soporte_id", soporteIdsParaBuscar)
        .order("fecha_creacion", { ascending: false });
      
      if (!errorAlquileres && alquileresPorSoporte) {
        // Combinar resultados, evitando duplicados
        const idsExistentes = new Set((data || []).map((a: any) => a.id));
        const nuevosAlquileres = alquileresPorSoporte.filter((a: any) => !idsExistentes.has(a.id));
        dataConSoportes = [...(data || []), ...nuevosAlquileres];
      }
    } catch (error) {
      console.warn('⚠️ [getAlquileres] Error obteniendo alquileres por soporte:', error);
    }
  }

  // Mapear datos del soporte y recalcular estado en tiempo real para coherencia inmediata.
  // El cron mantiene la BD sincronizada; aquí recalculamos para que la respuesta
  // siempre sea correcta incluso si el cron aún no ha corrido hoy.
  let alquileresConEstadoActualizado = dataConSoportes.map((alquiler: any) => {
    const estadoCalculado = recalcularEstadoAlquiler(alquiler as Alquiler);
    const soporteCodigo = alquiler.soporte_id ? codigosSoportes[alquiler.soporte_id] || null : null;
    const soporteTitulo = alquiler.soporte_id ? titulosSoportes[alquiler.soporte_id] || null : null;
    const soporteCiudad = alquiler.soporte_id ? ciudadesSoportes[alquiler.soporte_id] || null : null;
    return { ...alquiler, estado: estadoCalculado, soporte_codigo: soporteCodigo, soporte_titulo: soporteTitulo, soporte_ciudad: soporteCiudad } as any;
  });

  // Aplicar paginación si es necesario (ya que agregamos alquileres por soporte)
  let finalData = alquileresConEstadoActualizado;
  if (options?.page && options?.limit && (options.search && soporteIdsParaBuscar.length > 0)) {
    // Si agregamos resultados de búsqueda por soporte, necesitamos re-paginar
    const page = options.page || 1;
    const limit = options.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit;
    finalData = alquileresConEstadoActualizado.slice(from, to);
  }

  return {
    data: finalData,
    count: options?.search && soporteIdsParaBuscar.length > 0 
      ? alquileresConEstadoActualizado.length 
      : (count || 0),
  };
}

// Obtener un alquiler por ID
export async function getAlquilerById(id: string) {
  const supabase = getSupabaseServer();

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getAlquilerById] Buscando alquiler con ID:', id);
  }

  const { data, error } = await supabase
    .from("alquileres")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error('❌ [getAlquilerById] Error:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [getAlquilerById] Alquiler encontrado:', data?.codigo);
  }

  // Recalcular estado
  if (data) {
    const estadoCalculado = recalcularEstadoAlquiler(data as Alquiler);
    if (data.estado !== estadoCalculado) {
      try {
        const actualizado = await updateAlquiler(data.id, { estado: estadoCalculado });
        return actualizado;
      } catch (error) {
        console.warn(`⚠️ [getAlquilerById] Error actualizando estado:`, error);
        return { ...data, estado: estadoCalculado } as Alquiler;
      }
    }
    return { ...data, estado: estadoCalculado } as Alquiler;
  }

  return null;
}

// Crear un nuevo alquiler
export async function createAlquiler(alquiler: AlquilerInput) {
  const supabase = getSupabaseServer();

  // Calcular estado inicial
  const estadoCalculado = alquiler.inicio && alquiler.fin
    ? recalcularEstadoAlquiler({
        id: '',
        codigo: alquiler.codigo || '',
        cotizacion_id: alquiler.cotizacion_id,
        cliente: alquiler.cliente || null,
        vendedor: alquiler.vendedor || null,
        soporte_id: alquiler.soporte_id,
        inicio: alquiler.inicio,
        fin: alquiler.fin,
        meses: alquiler.meses || null,
        total: alquiler.total || null,
        estado: null,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
      })
    : 'reservado';

  // IMPORTANTE: Si soporte_id en la tabla alquileres es UUID pero soportes.id es numérico,
  // hay una inconsistencia en el esquema. El esquema debe ajustarse para que:
  // - Opción 1: soporte_id sea numérico (igual que soportes.id)
  // - Opción 2: soportes.id sea UUID y usemos ese UUID
  // Por ahora, intentamos usar el ID numérico directamente
  // Si el esquema requiere UUID, esto fallará y el usuario deberá ajustar el esquema
  
  const insertData: any = {
    codigo: alquiler.codigo || "",
    cotizacion_id: alquiler.cotizacion_id,
    cliente: alquiler.cliente || null,
    vendedor: alquiler.vendedor || null,
    soporte_id: alquiler.soporte_id, // Usar el valor tal cual (número o UUID según el esquema)
    inicio: alquiler.inicio,
    fin: alquiler.fin,
    meses: alquiler.meses || null,
    total: alquiler.total || null,
    estado: alquiler.estado || estadoCalculado,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('📝 [createAlquiler] Insertando alquiler:', JSON.stringify(insertData, null, 2));
  }

  const { data, error } = await supabase
    .from("alquileres")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ [createAlquiler] Error en inserción:', error);
    console.error('❌ [createAlquiler] Error code:', error.code);
    console.error('❌ [createAlquiler] Error message:', error.message);
    console.error('❌ [createAlquiler] Error details:', error.details);
    console.error('❌ [createAlquiler] Error hint:', error.hint);
    console.error('❌ [createAlquiler] Insert data:', JSON.stringify(insertData, null, 2));
    
    // Crear un error más descriptivo
    const errorMsg = error.message || `Error de Supabase: ${error.code || 'desconocido'}`;
    const supabaseError = new Error(errorMsg);
    (supabaseError as any).code = error.code;
    (supabaseError as any).details = error.details;
    (supabaseError as any).hint = error.hint;
    throw supabaseError;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [createAlquiler] Alquiler creado exitosamente:', data?.id, data?.codigo);
  }

  return data as Alquiler;
}

// Actualizar un alquiler
export async function updateAlquiler(
  id: string,
  alquiler: Partial<AlquilerInput>
) {
  const supabase = getSupabaseServer();

  // Obtener alquiler actual para validación y cálculo de estado
  const alquilerActual = await getAlquilerById(id);
  if (!alquilerActual) {
    throw new Error(`Alquiler con ID ${id} no encontrado`);
  }

  // Determinar fechas y soporte que se usarán (nuevos o actuales)
  const fechaInicio = alquiler.inicio !== undefined ? alquiler.inicio : alquilerActual.inicio;
  const fechaFin = alquiler.fin !== undefined ? alquiler.fin : alquilerActual.fin;
  const soporteId = alquiler.soporte_id !== undefined ? alquiler.soporte_id : alquilerActual.soporte_id;

  // VALIDACIÓN PREVENTIVA: Verificar solape si se cambian fechas o soporte
  // Esta validación es NO DESTRUCTIVA: solo lee datos, no modifica nada
  if (alquiler.inicio !== undefined || alquiler.fin !== undefined || alquiler.soporte_id !== undefined) {
    // Obtener código del soporte para mensaje de error claro
    let codigoSoporte: string | undefined;
    try {
      const { getSoporteById } = await import('./supabaseSoportes');
      const soporte = await getSoporteById(String(soporteId));
      codigoSoporte = soporte?.codigo;
    } catch (error) {
      console.warn('⚠️ [updateAlquiler] No se pudo obtener código del soporte para mensaje de error:', error);
    }

    // Validar solape excluyendo el alquiler actual
    await validarSolapeAlquileres(
      soporteId,
      fechaInicio,
      fechaFin,
      id, // Excluir el alquiler actual de la validación
      codigoSoporte
    );
  }

  const updateData: any = {};
  if (alquiler.codigo !== undefined) updateData.codigo = alquiler.codigo;
  if (alquiler.cliente !== undefined) updateData.cliente = alquiler.cliente;
  if (alquiler.vendedor !== undefined) updateData.vendedor = alquiler.vendedor;
  if (alquiler.soporte_id !== undefined) updateData.soporte_id = alquiler.soporte_id;
  if (alquiler.inicio !== undefined) updateData.inicio = alquiler.inicio;
  if (alquiler.fin !== undefined) updateData.fin = alquiler.fin;
  if (alquiler.meses !== undefined) updateData.meses = alquiler.meses;
  if (alquiler.total !== undefined) updateData.total = alquiler.total;
  if (alquiler.estado !== undefined) updateData.estado = alquiler.estado;

  // Actualizar fecha_actualizacion automáticamente
  updateData.fecha_actualizacion = new Date().toISOString();

  // Si se actualizan fechas, recalcular estado
  if (alquiler.inicio || alquiler.fin) {
    const estadoCalculado = recalcularEstadoAlquiler({
      ...alquilerActual,
      inicio: fechaInicio,
      fin: fechaFin,
    });
    updateData.estado = estadoCalculado;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📝 [updateAlquiler] Actualizando alquiler:', id);
    console.log('📝 [updateAlquiler] Datos a actualizar:', JSON.stringify(updateData, null, 2));
  }

  const { data, error } = await supabase
    .from("alquileres")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error('❌ [updateAlquiler] Error:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [updateAlquiler] Alquiler actualizado exitosamente:', data?.codigo);
  }

  return data as Alquiler;
}

// Eliminar un alquiler
export async function deleteAlquiler(id: string) {
  const supabase = getSupabaseServer();

  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ [deleteAlquiler] Eliminando alquiler:', id);
  }

  const { error } = await supabase
    .from("alquileres")
    .delete()
    .eq("id", id);

  if (error) {
    console.error('❌ [deleteAlquiler] Error:', error);
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [deleteAlquiler] Alquiler eliminado exitosamente');
  }

  return { success: true };
}

// Generar siguiente código de alquiler
export async function generarSiguienteCodigoAlquiler(): Promise<string> {
  try {
    const result = await getAlquileres({ limit: 10000 });
    const alquileres = result.data;

    if (alquileres.length === 0) {
      return "ALQ-0001";
    }

    // Extraer números de los códigos
    const numeros = alquileres
      .map((a) => {
        const match = a.codigo.match(/ALQ-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumero = Math.max(...numeros, 0);
    const siguiente = maxNumero + 1;

    return `ALQ-${siguiente.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generando código de alquiler:", error);
    return "ALQ-0001";
  }
}

// Obtener alquileres no finalizados para un soporte — BASADO EN FECHAS, no en estado persistido
export async function getAlquileresVigentesPorSoporte(soporteId: string | number) {
  const supabase = getSupabaseServer();

  const soporteIdValue = typeof soporteId === 'string' && !isNaN(Number(soporteId)) 
    ? Number(soporteId) 
    : soporteId;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyStr = hoy.toISOString().split('T')[0];

  // Vigente = fin >= hoy (no ha terminado aún)
  const { data, error } = await supabase
    .from("alquileres")
    .select("*")
    .eq("soporte_id", soporteIdValue)
    .gte("fin", hoyStr);

  if (error) {
    console.error('❌ [getAlquileresVigentesPorSoporte] Error:', error);
    throw error;
  }

  return (data || []) as Alquiler[];
}

/**
 * Sincronizar estados de TODOS los alquileres no finalizados.
 * Recalcula el estado de cada alquiler según sus fechas y lo persiste si difiere.
 * Debe ejecutarse ANTES de actualizar estados de soportes.
 */
export async function sincronizarEstadosAlquileresDiario() {
  const supabase = getSupabaseServer();
  console.log('🔄 [sincronizarEstadosAlquileresDiario] Iniciando...');

  // Traer alquileres que NO están finalizados (los finalizados ya no cambian)
  const { data: alquileres, error } = await supabase
    .from("alquileres")
    .select("*")
    .neq("estado", "finalizado");

  if (error) {
    console.error('❌ [sincronizarEstadosAlquileresDiario] Error obteniendo alquileres:', error);
    throw error;
  }

  if (!alquileres || alquileres.length === 0) {
    console.log('ℹ️ [sincronizarEstadosAlquileresDiario] No hay alquileres pendientes de sincronizar');
    return { actualizados: 0, revisados: 0 };
  }

  let actualizados = 0;

  for (const alquiler of alquileres) {
    const estadoCalculado = recalcularEstadoAlquiler(alquiler as Alquiler);
    if (alquiler.estado !== estadoCalculado) {
      const { error: updateError } = await supabase
        .from("alquileres")
        .update({ estado: estadoCalculado, fecha_actualizacion: new Date().toISOString() })
        .eq("id", alquiler.id);

      if (updateError) {
        console.warn(`⚠️ [sincronizarEstadosAlquileresDiario] Error actualizando ${alquiler.codigo}:`, updateError);
      } else {
        actualizados++;
      }
    }
  }

  console.log(`✅ [sincronizarEstadosAlquileresDiario] ${actualizados} de ${alquileres.length} alquileres actualizados`);
  return { actualizados, revisados: alquileres.length };
}

// Obtener todos los alquileres para actualizar estados de soportes
export async function getAllAlquileresParaActualizarSoportes() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("alquileres")
    .select("*");

  if (error) {
    console.error('❌ [getAllAlquileresParaActualizarSoportes] Error:', error);
    throw error;
  }

  return (data || []) as Alquiler[];
}

/**
 * Validar si un alquiler nuevo se solapa con alquileres existentes del mismo soporte
 * Regla de solape: inicio_nuevo <= fin_existente AND fin_nuevo >= inicio_existente
 * 
 * @param soporteId - ID del soporte
 * @param fechaInicio - Fecha de inicio del alquiler nuevo
 * @param fechaFin - Fecha de fin del alquiler nuevo
 * @param alquilerIdExcluir - ID del alquiler a excluir de la validación (útil para edición)
 * @param codigoSoporte - Código del soporte para el mensaje de error (opcional)
 * @returns Objeto con { haySolape: boolean, alquilerSolapado: Alquiler | null }
 * @throws Error si hay solape con mensaje claro
 */
export async function validarSolapeAlquileres(
  soporteId: string | number,
  fechaInicio: string,
  fechaFin: string,
  alquilerIdExcluir?: string,
  codigoSoporte?: string
): Promise<{ haySolape: boolean; alquilerSolapado: Alquiler | null }> {
  const supabase = getSupabaseServer();

  // Convertir a número si es posible
  const soporteIdValue = typeof soporteId === 'string' && !isNaN(Number(soporteId)) 
    ? Number(soporteId) 
    : soporteId;

  // Obtener todos los alquileres del mismo soporte (sin filtrar por estado)
  let query = supabase
    .from("alquileres")
    .select("*")
    .eq("soporte_id", soporteIdValue);

  // Excluir el alquiler actual si se está editando
  if (alquilerIdExcluir) {
    query = query.neq("id", alquilerIdExcluir);
  }

  const { data: alquileresExistentes, error } = await query;

  if (error) {
    console.error('❌ [validarSolapeAlquileres] Error consultando alquileres:', error);
    throw error;
  }

  if (!alquileresExistentes || alquileresExistentes.length === 0) {
    return { haySolape: false, alquilerSolapado: null };
  }

  // Convertir fechas a Date para comparación
  const inicioNuevo = new Date(fechaInicio);
  inicioNuevo.setHours(0, 0, 0, 0);
  const finNuevo = new Date(fechaFin);
  finNuevo.setHours(0, 0, 0, 0);

  // Verificar solape con cada alquiler existente
  // Regla: inicio_nuevo <= fin_existente AND fin_nuevo >= inicio_existente
  for (const alquilerExistente of alquileresExistentes) {
    const inicioExistente = new Date(alquilerExistente.inicio);
    inicioExistente.setHours(0, 0, 0, 0);
    const finExistente = new Date(alquilerExistente.fin);
    finExistente.setHours(0, 0, 0, 0);

    // Verificar solape
    if (inicioNuevo <= finExistente && finNuevo >= inicioExistente) {
      // Hay solape
      const mensajeError = codigoSoporte
        ? `El soporte ${codigoSoporte} ya tiene un alquiler que se solapa con el rango de fechas seleccionado.`
        : `El soporte ya tiene un alquiler que se solapa con el rango de fechas seleccionado.`;
      
      const error = new Error(mensajeError);
      (error as any).alquilerSolapado = alquilerExistente;
      throw error;
    }
  }

  return { haySolape: false, alquilerSolapado: null };
}

// Obtener alquileres de una cotización específica con información del soporte
export async function getAlquileresPorCotizacion(cotizacionId: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("alquileres")
    .select(`
      *,
      soportes:soporte_id (
        id,
        codigo,
        titulo,
        zona,
        ciudad,
        pais,
        latitud,
        longitud,
        imagen_principal
      )
    `)
    .eq("cotizacion_id", cotizacionId);

  if (error) {
    console.error('❌ [getAlquileresPorCotizacion] Error:', error);
    throw error;
  }

  return (data || []) as any[];
}

// Cancelar (eliminar) todos los alquileres de una cotización
export async function cancelarAlquileresDeCotizacion(cotizacionId: string) {
  const supabase = getSupabaseServer();

  console.log(`🗑️ Cancelando alquileres de cotización ${cotizacionId}...`);

  // Primero obtener los alquileres para saber qué soportes actualizar
  const alquileres = await getAlquileresPorCotizacion(cotizacionId);
  
  if (alquileres.length === 0) {
    console.log(`ℹ️ No hay alquileres para cancelar en cotización ${cotizacionId}`);
    return { alquileresCancelados: [], soportesAfectados: [] };
  }

  // Eliminar los alquileres
  const { error } = await supabase
    .from("alquileres")
    .delete()
    .eq("cotizacion_id", cotizacionId);

  if (error) {
    console.error('❌ [cancelarAlquileresDeCotizacion] Error:', error);
    throw error;
  }

  // Obtener IDs únicos de soportes afectados
  const soportesAfectados = [...new Set(alquileres.map(a => a.soporte_id))];

  console.log(`✅ ${alquileres.length} alquiler(es) cancelado(s), ${soportesAfectados.length} soporte(s) afectado(s)`);

  return {
    alquileresCancelados: alquileres,
    soportesAfectados
  };
}

