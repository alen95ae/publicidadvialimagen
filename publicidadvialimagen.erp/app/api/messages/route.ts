import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/messages - Iniciando consulta a Supabase");

    // Usar cliente de usuario (RLS controla acceso por permisos)
    const supabase = await getSupabaseUser(request);
    
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error("❌ Error fetching messages from Supabase:", error);
      return NextResponse.json({ 
        error: "Error al obtener mensajes", 
        details: error.message
      }, { status: 500 });
    }

    // Mapear los campos de Supabase al formato esperado por el frontend
    const mensajes = (data || []).map((msg: any) => ({
      id: msg.id,
      nombre: msg.nombre || '',
      email: msg.email || '',
      telefono: msg.telefono || '',
      empresa: msg.empresa || '',
      mensaje: msg.mensaje || '',
      fecha_recepcion: msg.fecha || msg.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: msg.estado === 'LEIDO' ? 'LEÍDO' : (msg.estado || 'NUEVO'),
      origen: 'contacto' as const,
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }));

    console.log(`✅ Se obtuvieron ${mensajes.length} mensajes de Supabase`);

    return NextResponse.json(mensajes);
  } catch (error) {
    console.error("❌ Error fetching messages from Supabase:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Error al obtener mensajes", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const record = await airtable("Mensajes").create({
      Nombre: body.name,
      Email: body.email,
      Teléfono: body.phone,
      Empresa: body.company,
      Mensaje: body.message,
      Estado: "NUEVO",
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error("Error creating message in Airtable:", error);
    return NextResponse.json({ error: "Error al crear mensaje" }, { status: 500 });
  }
}
