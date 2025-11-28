import { getSupabaseServer } from "@/lib/supabaseServer";
import { normalizeText } from "./utils";

// Tipo base igual a la tabla real de Supabase
export type Soporte = {
  id: number;
  codigo: string | null;
  titulo: string | null;
  tipo_soporte: string | null;
  estado: string | null;
  ancho: number | null;
  alto: number | null;
  area_total: number | null;
  area_total_calculada: number | null;
  iluminacion: boolean | null;
  precio_mensual: number | null;
  precio_m2_calculado: number | null;
  impactos_diarios: number | null;
  propietario: string | null;
  ciudad: string | null;
  zona: string | null;
  pais: string | null;
  enlace_maps: string | null;
  latitud: number | null;
  longitud: number | null;
  imagen_principal: any | null;
  imagen_secundaria_1: any | null;
  imagen_secundaria_2: any | null;
  descripcion: string | null;
  sustrato: string | null;
  resumen_ia: string | null;
  created_at: string;
};

export async function getSoportes({
  q = "",
  status = "",
  city = "",
  page = 1,
  limit = 25,
}: {
  q?: string;
  status?: string;
  city?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = getSupabaseServer();

  let query = supabase
    .from("soportes")
    .select("*", { count: "exact" });

  // TEXT SEARCH (normalizado sin tildes)
  if (q.trim() !== "") {
    const term = `%${normalizeText(q.trim())}%`;
    // Nota: Supabase no tiene una función nativa para ignorar tildes,
    // así que normalizamos el término de búsqueda antes de enviarlo
    query = query.or(
      `codigo.ilike.${term},titulo.ilike.${term},ciudad.ilike.${term},tipo_soporte.ilike.${term}`
    );
  }

  // STATUS
  if (status) {
    const statuses = status.split(",").map((s) => s.trim());
    query = query.in("estado", statuses);
  }

  // CITY (normalizado sin tildes)
  if (city) {
    const normalizedCity = normalizeText(city);
    query = query.ilike("ciudad", `%${normalizedCity}%`);
  }

  // PAGINACIÓN
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Ordenar por fecha de creación descendente (más recientes primero)
  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data as Soporte[],
    count: count || 0,
  };
}

export async function getSoporteById(id: string) {
  const supabase = getSupabaseServer();

  // Convertir ID a número si es posible (Supabase usa number para id)
  const numericId = isNaN(Number(id)) ? id : Number(id)

  const { data, error } = await supabase
    .from("soportes")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error) {
    console.error('❌ Error en getSoporteById:', error)
    return null
  }

  return data as Soporte;
}

export async function createSoporte(body: Partial<Soporte>) {
  const supabase = getSupabaseServer();

  console.log("🆕 createSoporte - Payload recibido:", JSON.stringify(body, null, 2));
  console.log("🆕 createSoporte - Campos incluidos:", Object.keys(body));

  const { data, error } = await supabase
    .from("soportes")
    .insert([body])
    .select()
    .single();

  if (error) {
    console.error("❌ Error de Supabase en createSoporte:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  console.log("✅ Soporte creado exitosamente:", data?.id);

  return data as Soporte;
}

export async function updateSoporte(id: string, body: Partial<Soporte>) {
  const supabase = getSupabaseServer();

  // Convertir ID a número si es posible (Supabase usa number para id)
  const numericId = isNaN(Number(id)) ? id : Number(id)

  console.log('📤 updateSoporte - ID original:', id, 'ID convertido:', numericId, 'tipo:', typeof numericId)
  console.log('📤 updateSoporte - Body:', JSON.stringify(body, null, 2))

  const { data, error } = await supabase
    .from("soportes")
    .update(body)
    .eq("id", numericId)
    .select()
    .single();

  if (error) {
    const errorInfo = {
      message: error.message || 'Sin mensaje',
      details: error.details || 'Sin detalles',
      hint: error.hint || 'Sin hint',
      code: error.code || 'Sin código'
    }
    console.error('❌ Error de Supabase en updateSoporte:', JSON.stringify(errorInfo, null, 2))
    console.error('❌ Error completo (objeto):', error)
    
    // Crear un error más descriptivo
    const errorMsg = error.message || `Error de Supabase: ${error.code || 'desconocido'}`
    const supabaseError = new Error(errorMsg)
    ;(supabaseError as any).details = error.details
    ;(supabaseError as any).hint = error.hint
    ;(supabaseError as any).code = error.code
    throw supabaseError
  }

  return data as Soporte;
}

export async function deleteSoporte(id: string) {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from("soportes")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return { deleted: true };
}

export async function getAllSoportes() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("soportes")
    .select("*");

  if (error) throw error;

  return data as Soporte[];
}
