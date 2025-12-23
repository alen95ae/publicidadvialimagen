export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { verifySession } from "@/lib/auth/verifySession";

/**
 * PATCH - Marcar notificación como leída
 * 
 * MODELO LEGACY:
 * - Actualiza notificaciones.leida = true
 * - NO usa notificaciones_leidas
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Verificar sesión
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

    const { id } = await Promise.resolve(params);
    const supabase = getSupabaseAdmin();

    // Actualizar notificaciones.leida directamente (MODELO LEGACY)
    const { error: updateError } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);

    if (updateError) {
      console.error("Error marcando notificación como leída:", updateError);
      return NextResponse.json(
        { error: "Error al marcar como leída", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error en PATCH /api/notificaciones/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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

    const { id } = await Promise.resolve(params);
    const supabase = getSupabaseAdmin();

    // Eliminar la notificación completa (MODELO LEGACY)
    const { error: deleteError } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Error eliminando notificación:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Notificación eliminada" });
  } catch (error) {
    console.error("Error en DELETE /api/notificaciones/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
