import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth";

/**
 * Endpoint público pero seguro para obtener lista de comerciales (vendedores)
 * Accesible por cualquier usuario autenticado, sin requerir permisos de admin
 * 
 * FASE 0: Migrado a usar cliente de usuario (bajo riesgo - lectura pública de vendedores)
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación (solo que esté logueado, sin verificar permisos)
    const token = req.cookies.get("session")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // FASE 0: Usar cliente de usuario (bajo riesgo - lectura pública de vendedores)
    const supabase = await getSupabaseUser(req);
    // ⚠️ TEMPORAL: Fallback a admin si no hay sesión (solo para FASE 0)
    // ANTES DE ACTIVAR RLS: Eliminar este fallback y manejar el error correctamente
    const supabaseClient = supabase || getSupabaseAdmin();

    // Consultar usuarios con vendedor = true
    const { data, error } = await supabaseClient
      .from("usuarios")
      .select("id, nombre, email, vendedor, imagen_usuario, numero")
      .eq("vendedor", true)
      .order("nombre", { ascending: true });

    if (error) {
      console.error("❌ [API Comerciales] Error consultando usuarios:", error);
      return NextResponse.json({ users: [] }, { status: 500 });
    }

    console.log(`✅ [API Comerciales] Retornando ${data?.length || 0} comerciales`);

    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error("❌ [API Comerciales] Error:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}


