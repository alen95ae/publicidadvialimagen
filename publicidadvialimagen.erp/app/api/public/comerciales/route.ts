import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth";

/**
 * Endpoint público pero seguro para obtener lista de comerciales (vendedores)
 * Accesible por cualquier usuario autenticado, sin requerir permisos de admin
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

    // Obtener cliente de Supabase con Service Role (bypass RLS)
    const supabase = getSupabaseServer();

    // Consultar usuarios con vendedor = true
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, email, vendedor, imagen_usuario")
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


