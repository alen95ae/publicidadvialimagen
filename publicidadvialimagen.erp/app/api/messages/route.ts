import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";
import { notificarFormularioNuevo } from "@/lib/notificaciones";

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs' // Asegurar runtime Node.js para notificaciones

export async function GET(request: NextRequest) {
  try {
    console.log('[API /api/messages] GET request received')
    
    // Verificar sesión del usuario
    const token = request.cookies.get('session')?.value;
    console.log('[API /api/messages] Token from cookies:', token ? 'FOUND' : 'NOT FOUND')
    
    if (!token) {
      console.warn('[API /api/messages] No token - returning 401')
      return NextResponse.json({ error: "No autorizado - no token" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        console.warn('[API /api/messages] Invalid session payload')
        return NextResponse.json({ error: "No autorizado - sesión inválida" }, { status: 401 });
      }
      userId = payload.sub;
      console.log('[API /api/messages] User authenticated:', userId)
    } catch (error) {
      console.error('[API /api/messages] Session verification failed:', error)
      return NextResponse.json({ error: "No autorizado - verificación falló" }, { status: 401 });
    }

    // TEMPORAL: Usar admin client para mensajes (son datos del sistema)
    // Los mensajes NO necesitan RLS por usuario, son visibles para todos los usuarios autenticados
    const supabase = getSupabaseAdmin();
    
    // Consultar formularios desde la tabla 'formularios'
    console.log('[API /api/messages] Querying formularios table...')
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('[API /api/messages] Supabase query error:', error);
      return NextResponse.json({ 
        error: "Error al obtener mensajes", 
        details: error.message
      }, { status: 500 });
    }

    console.log('[API /api/messages] Query successful, records:', data?.length || 0)

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
      asignado_a: msg.asignado_a || null,
      created_at: msg.created_at,
      updated_at: msg.updated_at
    }));

    return NextResponse.json(mensajes);
  } catch (error) {
    console.error("Error fetching messages from Supabase:", error);
    return NextResponse.json({ 
      error: "Error al obtener mensajes", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API /api/messages] POST request received')
    
    const body = await req.json();
    
    // Verificar sesión del usuario
    const token = req.cookies.get('session')?.value;
    console.log('[API /api/messages] Token from cookies:', token ? 'FOUND' : 'NOT FOUND')
    
    if (!token) {
      console.warn('[API /api/messages] No token - returning 401')
      return NextResponse.json({ error: "No autorizado - no token" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        console.warn('[API /api/messages] Invalid session payload')
        return NextResponse.json({ error: "No autorizado - sesión inválida" }, { status: 401 });
      }
      userId = payload.sub;
      console.log('[API /api/messages] User authenticated:', userId)
    } catch (error) {
      console.error('[API /api/messages] Session verification failed:', error)
      return NextResponse.json({ error: "No autorizado - verificación falló" }, { status: 401 });
    }

    // Usar admin client para crear mensajes
    const supabase = getSupabaseAdmin();

    // Crear formulario en Supabase
    console.log('[API /api/messages] Creating formulario...')
    const { data: record, error: insertError } = await supabase
      .from('formularios')
      .insert({
        nombre: body.name || body.nombre || '',
        email: body.email || '',
        telefono: body.phone || body.telefono || null,
        empresa: body.company || body.empresa || null,
        mensaje: body.message || body.mensaje || '',
        estado: 'NUEVO',
        fecha: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API /api/messages] Error creating message:', insertError);
      return NextResponse.json({ 
        error: "Error al crear mensaje",
        details: insertError.message
      }, { status: 500 });
    }

    console.log('[API /api/messages] Message created:', record.id)
    
    // Crear notificación OBLIGATORIA para usuarios con permiso de mensajes
    // Si falla, loguear pero NO fallar la creación del formulario
    console.log('[API /api/messages] ==========================================')
    console.log('[API /api/messages] LLAMANDO A notificarFormularioNuevo()')
    console.log('[API /api/messages] Formulario ID:', record.id)
    console.log('[API /api/messages] ==========================================')
    
    try {
      await notificarFormularioNuevo(
        record.id,
        record.nombre || body.name || body.nombre || 'Sin nombre',
        record.email || body.email || ''
      );
      console.log('[API /api/messages] ✅ Notificación creada para formulario:', record.id)
    } catch (notifError) {
      // Log error pero NO fallar la creación del formulario
      console.error('[API /api/messages] ❌ ERROR creando notificación (continuando):', notifError);
      console.error('[API /api/messages] Error details:', notifError instanceof Error ? notifError.message : String(notifError));
    }
    
    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error('[API /api/messages] Error creating message:', error);
    return NextResponse.json({ 
      error: "Error al crear mensaje",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
