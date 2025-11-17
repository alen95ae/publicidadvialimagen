import { getSupabaseServer } from "@/lib/supabaseServer";

// Tipo base igual a la tabla real de Supabase
export type CotizacionLinea = {
  id: string;
  cotizacion_id: string;
  tipo: string;
  codigo_producto: string | null;
  nombre_producto: string | null;
  descripcion: string | null;
  cantidad: number | null;
  ancho: number | null;
  alto: number | null;
  total_m2: number | null;
  unidad_medida: string | null;
  precio_unitario: number | null;
  comision: number | null;
  con_iva: boolean | null;
  con_it: boolean | null;
  es_soporte: boolean | null;
  orden: number | null;
  imagen: string | null;
  variantes: any | null; // JSONB
  subtotal_linea: number | null;
  fecha_creacion: string;
};

// Interfaz para crear/actualizar línea
export interface CotizacionLineaInput {
  cotizacion_id: string;
  tipo?: string;
  codigo_producto?: string;
  nombre_producto?: string;
  descripcion?: string;
  cantidad?: number;
  ancho?: number;
  alto?: number;
  total_m2?: number;
  unidad_medida?: string;
  precio_unitario?: number;
  comision?: number;
  con_iva?: boolean;
  con_it?: boolean;
  es_soporte?: boolean;
  orden?: number;
  imagen?: string;
  variantes?: any;
  subtotal_linea?: number;
}

// Obtener todas las líneas de una cotización
export async function getLineasByCotizacionId(cotizacionId: string) {
  const supabase = getSupabaseServer();

  // Primero verificar que la cotización existe
  const { data: cotizacion, error: cotizacionError } = await supabase
    .from("cotizaciones")
    .select("id")
    .eq("id", cotizacionId)
    .single();

  if (cotizacionError || !cotizacion) {
    throw new Error(`Cotización con ID ${cotizacionId} no existe`);
  }

  const { data, error } = await supabase
    .from("cotizacion_lineas")
    .select("*")
    .eq("cotizacion_id", cotizacionId)
    .order("orden", { ascending: true });

  if (error) {
    console.error('❌ [getLineasByCotizacionId] Error:', error)
    console.error('❌ [getLineasByCotizacionId] Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [getLineasByCotizacionId] Líneas encontradas:', data?.length || 0)
  }

  return (data || []) as CotizacionLinea[];
}

// Obtener una línea por ID
export async function getLineaById(id: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("cotizacion_lineas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as CotizacionLinea;
}

// Crear una nueva línea
export async function createLinea(linea: CotizacionLineaInput) {
  const supabase = getSupabaseServer();

  // Validar que la cotización existe
  const { data: cotizacion, error: cotizacionError } = await supabase
    .from("cotizaciones")
    .select("id")
    .eq("id", linea.cotizacion_id)
    .single();

  if (cotizacionError || !cotizacion) {
    throw new Error(`Cotización con ID ${linea.cotizacion_id} no existe`);
  }

  const insertData = {
    cotizacion_id: linea.cotizacion_id,
    tipo: linea.tipo || "Producto",
    codigo_producto: linea.codigo_producto || null,
    nombre_producto: linea.nombre_producto || null,
    descripcion: linea.descripcion || null,
    cantidad: linea.cantidad || 0,
    ancho: linea.ancho || null,
    alto: linea.alto || null,
    total_m2: linea.total_m2 || null,
    unidad_medida: linea.unidad_medida || "m²",
    precio_unitario: linea.precio_unitario || 0,
    comision: linea.comision || 0,
    con_iva: linea.con_iva !== undefined ? linea.con_iva : true,
    con_it: linea.con_it !== undefined ? linea.con_it : true,
    es_soporte: linea.es_soporte || false,
    orden: linea.orden || 0,
    imagen: linea.imagen || null,
    variantes: linea.variantes || null,
    subtotal_linea: linea.subtotal_linea || 0,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📝 [createLinea] Insertando línea:', JSON.stringify(insertData, null, 2))
  }

  const { data, error } = await supabase
    .from("cotizacion_lineas")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ [createLinea] Error:', error)
    console.error('❌ [createLinea] Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [createLinea] Línea creada exitosamente:', data?.id)
  }

  return data as CotizacionLinea;
}

// Crear múltiples líneas
export async function createMultipleLineas(lineas: CotizacionLineaInput[]) {
  if (lineas.length === 0) return [];

  // Validar que todas las líneas pertenecen a la misma cotización
  const cotizacionId = lineas[0].cotizacion_id;
  if (!lineas.every((l) => l.cotizacion_id === cotizacionId)) {
    throw new Error("Todas las líneas deben pertenecer a la misma cotización");
  }

  // Validar que la cotización existe
  const supabase = getSupabaseServer();
  const { data: cotizacion, error: cotizacionError } = await supabase
    .from("cotizaciones")
    .select("id")
    .eq("id", cotizacionId)
    .single();

  if (cotizacionError || !cotizacion) {
    throw new Error(`Cotización con ID ${cotizacionId} no existe`);
  }

  // Preparar datos para insertar
  const insertData = lineas.map((linea) => ({
    cotizacion_id: linea.cotizacion_id,
    tipo: linea.tipo || "Producto",
    codigo_producto: linea.codigo_producto || null,
    nombre_producto: linea.nombre_producto || null,
    descripcion: linea.descripcion || null,
    cantidad: linea.cantidad || 0,
    ancho: linea.ancho || null,
    alto: linea.alto || null,
    total_m2: linea.total_m2 || null,
    unidad_medida: linea.unidad_medida || "m²",
    precio_unitario: linea.precio_unitario || 0,
    comision: linea.comision || 0,
    con_iva: linea.con_iva !== undefined ? linea.con_iva : true,
    con_it: linea.con_it !== undefined ? linea.con_it : true,
    es_soporte: linea.es_soporte || false,
    orden: linea.orden || 0,
    imagen: linea.imagen || null,
    variantes: linea.variantes || null,
    subtotal_linea: linea.subtotal_linea || 0,
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('📝 [createMultipleLineas] Insertando líneas:', insertData.length, 'líneas')
    console.log('📝 [createMultipleLineas] Primera línea ejemplo:', JSON.stringify(insertData[0], null, 2))
    console.log('📝 [createMultipleLineas] Verificando Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  const { data, error } = await supabase
    .from("cotizacion_lineas")
    .insert(insertData)
    .select();

  if (error) {
    console.error('❌ [createMultipleLineas] Error en inserción:', error)
    console.error('❌ [createMultipleLineas] Error details:', JSON.stringify(error, null, 2))
    console.error('❌ [createMultipleLineas] Error code:', (error as any).code)
    console.error('❌ [createMultipleLineas] Error message:', (error as any).message)
    console.error('❌ [createMultipleLineas] Error hint:', (error as any).hint)
    console.error('❌ [createMultipleLineas] Insert data (first item):', JSON.stringify(insertData[0], null, 2))
    throw error
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ [createMultipleLineas] Líneas creadas exitosamente:', data?.length || 0)
  }

  return (data || []) as CotizacionLinea[];
}

// Actualizar una línea
export async function updateLinea(id: string, linea: Partial<CotizacionLineaInput>) {
  const supabase = getSupabaseServer();

  const updateData: any = {};
  if (linea.tipo !== undefined) updateData.tipo = linea.tipo;
  if (linea.codigo_producto !== undefined) updateData.codigo_producto = linea.codigo_producto;
  if (linea.nombre_producto !== undefined) updateData.nombre_producto = linea.nombre_producto;
  if (linea.descripcion !== undefined) updateData.descripcion = linea.descripcion;
  if (linea.cantidad !== undefined) updateData.cantidad = linea.cantidad;
  if (linea.ancho !== undefined) updateData.ancho = linea.ancho;
  if (linea.alto !== undefined) updateData.alto = linea.alto;
  if (linea.total_m2 !== undefined) updateData.total_m2 = linea.total_m2;
  if (linea.unidad_medida !== undefined) updateData.unidad_medida = linea.unidad_medida;
  if (linea.precio_unitario !== undefined) updateData.precio_unitario = linea.precio_unitario;
  if (linea.comision !== undefined) updateData.comision = linea.comision;
  if (linea.con_iva !== undefined) updateData.con_iva = linea.con_iva;
  if (linea.con_it !== undefined) updateData.con_it = linea.con_it;
  if (linea.es_soporte !== undefined) updateData.es_soporte = linea.es_soporte;
  if (linea.orden !== undefined) updateData.orden = linea.orden;
  if (linea.imagen !== undefined) updateData.imagen = linea.imagen;
  if (linea.variantes !== undefined) updateData.variantes = linea.variantes;
  if (linea.subtotal_linea !== undefined) updateData.subtotal_linea = linea.subtotal_linea;

  const { data, error } = await supabase
    .from("cotizacion_lineas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as CotizacionLinea;
}

// Eliminar una línea
export async function deleteLinea(id: string) {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from("cotizacion_lineas")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return { success: true };
}

// Eliminar todas las líneas de una cotización
export async function deleteLineasByCotizacionId(cotizacionId: string) {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from("cotizacion_lineas")
    .delete()
    .eq("cotizacion_id", cotizacionId);

  if (error) throw error;

  return { success: true };
}

