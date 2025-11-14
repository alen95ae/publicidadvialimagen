import { NextResponse } from "next/server";
import { messagesService } from "@/lib/messages";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = params instanceof Promise ? await params : params;
    const mensaje = await messagesService.getMessageById(id);
    
    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }

    return NextResponse.json(mensaje);
  } catch (error) {
    console.error("Error fetching message from Supabase:", error);
    return NextResponse.json({ error: "Error al obtener mensaje" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = params instanceof Promise ? await params : params;
    const body = await req.json();
    console.log('🔍 PATCH /api/messages/[id] - ID:', id);
    console.log('🔍 PATCH /api/messages/[id] - Body:', body);

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

      console.log('🔄 Actualizando estado a:', body.estado);
      const success = await messagesService.updateMessageStatus(id, body.estado as "NUEVO" | "LEÍDO" | "CONTESTADO");
      
      if (!success) {
        console.error('❌ Error al actualizar estado - success es false');
        return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
      }
      
      console.log('✅ Estado actualizado correctamente, obteniendo mensaje actualizado...');
      const mensaje = await messagesService.getMessageById(id);
      
      if (!mensaje) {
        console.error('❌ No se pudo obtener el mensaje actualizado');
        return NextResponse.json({ error: "Error al obtener mensaje actualizado" }, { status: 500 });
      }
      
      console.log('✅ Mensaje actualizado:', mensaje.id, 'Estado:', mensaje.estado);
      return NextResponse.json({ 
        success: true, 
        id: mensaje.id,
        estado: mensaje.estado 
      });
    }

    // Si se actualiza el mensaje completo
    const mensaje = await messagesService.updateMessage(id, body);
    if (!mensaje) {
      console.error('❌ Error al actualizar mensaje completo');
      return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
    }

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = params instanceof Promise ? await params : params;
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('mensajes')
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
