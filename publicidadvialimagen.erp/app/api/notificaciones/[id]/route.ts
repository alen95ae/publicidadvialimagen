import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

/**
 * PATCH - Marcar notificación como leída
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Verificar sesión del usuario
    const token = request.cookies.get('session')?.value;
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

    const { id } = params instanceof Promise ? await params : params;
    const supabase = getSupabaseAdmin();

    // Verificar que la notificación pertenece al usuario
    const { data: notificacion, error: fetchError } = await supabase
      .from('notificaciones')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Marcar como leída
    const { error: updateError } = await supabase
      .from('notificaciones')
      .update({ leida: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) {
      console.error("Error actualizando notificación:", updateError);
      return NextResponse.json({ 
        error: "Error al actualizar notificación", 
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/notificaciones/[id]:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar notificación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Verificar sesión del usuario
    const token = request.cookies.get('session')?.value;
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

    const { id } = params instanceof Promise ? await params : params;
    const supabase = getSupabaseAdmin();

    // Verificar que la notificación pertenece al usuario antes de eliminar
    const { data: notificacion, error: fetchError } = await supabase
      .from('notificaciones')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Eliminar notificación
    const { error: deleteError } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error("Error eliminando notificación:", deleteError);
      return NextResponse.json({ 
        error: "Error al eliminar notificación", 
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/notificaciones/[id]:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 });
  }
}
