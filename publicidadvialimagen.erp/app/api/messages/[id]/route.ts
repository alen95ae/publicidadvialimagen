export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = params instanceof Promise ? await params : params;
    
    // Verificar sesión del usuario
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      userId = payload.sub;
    } catch (error) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar admin client para leer formularios
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching message from Supabase:", error);
      return NextResponse.json({ error: "Error al obtener mensaje" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }

    // Mapear los campos de Supabase al formato esperado por el frontend
    const mensaje = {
      id: data.id,
      nombre: data.nombre || '',
      email: data.email || '',
      telefono: data.telefono || '',
      empresa: data.empresa || '',
      mensaje: data.mensaje || '',
      fecha_recepcion: data.fecha || data.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: data.estado === 'LEIDO' ? 'LEÍDO' : (data.estado || 'NUEVO'),
      origen: 'contacto' as const,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    return NextResponse.json(mensaje);
  } catch (error) {
    console.error("Error fetching message from Supabase:", error);
    return NextResponse.json({ error: "Error al obtener mensaje" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = params instanceof Promise ? await params : params;
    const body = await req.json();
    console.log('🔍 PATCH /api/messages/[id] - ID:', id);
    console.log('🔍 PATCH /api/messages/[id] - Body:', body);

    // Verificar sesión del usuario
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      userId = payload.sub;
    } catch (error) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar admin client para actualizar formularios
    const supabase = getSupabaseAdmin();

    // Si solo se actualiza el estado
    if (body.estado) {
      // Validar que el estado sea válido
      const estadosValidos = ['NUEVO', 'LEÍDO', 'CONTESTADO'];
      if (!estadosValidos.includes(body.estado)) {
        console.error('❌ Estado inválido:', body.estado);
        return NextResponse.json({ 
          error: "Estado inválido. Debe ser: NUEVO, LEÍDO o CONTESTADO" 
        }, { status: 400 });
      }

      // Mapear "LEÍDO" a "LEIDO" para la BD
      const estadoParaBD = body.estado === 'LEÍDO' ? 'LEIDO' : body.estado.trim();

      console.log('🔄 Actualizando estado a:', body.estado);
      
      const { data, error: updateError } = await supabase
        .from('formularios')
        .update({ 
          estado: estadoParaBD,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error al actualizar estado:', updateError);
        return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
      }
      
      if (!data) {
        console.error('❌ No se pudo obtener el mensaje actualizado');
        return NextResponse.json({ error: "Error al obtener mensaje actualizado" }, { status: 500 });
      }
      
      // Mapear de vuelta "LEIDO" a "LEÍDO" para el frontend
      const estadoFrontend = data.estado === 'LEIDO' ? 'LEÍDO' : data.estado;
      
      console.log('✅ Mensaje actualizado:', data.id, 'Estado:', estadoFrontend);
      return NextResponse.json({ 
        success: true, 
        id: data.id,
        estado: estadoFrontend
      });
    }

    // Si se actualiza el mensaje completo
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.empresa !== undefined) updateData.empresa = body.empresa;
    if (body.mensaje !== undefined) updateData.mensaje = body.mensaje;
    // Mapear "LEÍDO" a "LEIDO" para la BD
    if (body.estado !== undefined) {
      updateData.estado = body.estado === 'LEÍDO' ? 'LEIDO' : body.estado;
    }

    const { data, error: updateError } = await supabase
      .from('formularios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar mensaje completo:', updateError);
      return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
    }

    // Mapear los campos de Supabase al formato esperado por el frontend
    const mensaje = {
      id: data.id,
      nombre: data.nombre || '',
      email: data.email || '',
      telefono: data.telefono || '',
      empresa: data.empresa || '',
      mensaje: data.mensaje || '',
      fecha_recepcion: data.fecha || data.created_at || new Date().toISOString(),
      // Mapear "LEIDO" (sin tilde) de la BD a "LEÍDO" (con tilde) para el frontend
      estado: data.estado === 'LEIDO' ? 'LEÍDO' : (data.estado || 'NUEVO'),
      origen: 'contacto' as const,
      asignado_a: data.asignado_a || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    return NextResponse.json({ 
      success: true, 
      ...mensaje
    });
  } catch (error) {
    console.error("❌ Error updating message in Supabase:", error);
    console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: "Error al actualizar mensaje",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = params instanceof Promise ? await params : params;
    
    // Verificar sesión del usuario
    const token = req.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = await verifySession(token);
      if (!payload || !payload.sub) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      userId = payload.sub;
    } catch (error) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Usar admin client para eliminar formularios
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting message:", error);
      return NextResponse.json({ error: "Error al eliminar mensaje" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message in Supabase:", error);
    return NextResponse.json({ error: "Error al eliminar mensaje" }, { status: 500 });
  }
}
